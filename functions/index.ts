import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Helper function to get permissions based on a role
const getPermissionsForRole = (role: string) => {
  const allPermissions = {
    canScan: true,
    canViewServiceList: true,
    canViewClients: true,
    canViewScheduledServices: true,
    canViewHistory: true,
    canViewSettings: true,
    canManageUsers: true,
  };

  switch (role) {
  case "Administrator":
    return allPermissions;
  case "Serwisant":
    return {
      ...allPermissions,
      canViewSettings: false,
      canManageUsers: false,
    };
  case "Biuro":
    return {
      ...allPermissions,
      canScan: false, // Office role can't scan
      canViewSettings: false,
      canManageUsers: false,
    };
  default: // Default to a safe, restrictive role if something is wrong
    return {
      canScan: false,
      canViewServiceList: false,
      canViewClients: false,
      canViewScheduledServices: false,
      canViewHistory: false,
      canViewSettings: false,
      canManageUsers: false,
    };
  }
};


// Funkcja do tworzenia nowego użytkownika w Firebase Auth i zapisu jego danych w Firestore
export const createNewUser = functions.https.onCall(async (data, context) => {
  // Sprawdzenie, czy wywołujący jest zalogowany i ma uprawnienia admina
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musisz być zalogowany, aby tworzyć użytkowników.",
    );
  }

  const callerUid = context.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!callerData?.permissions?.canManageUsers) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Nie masz uprawnień do tworzenia nowych użytkowników.",
    );
  }

  const { email, password, role, organizationId } = data;

  if (!email || !password || !role || !organizationId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Brak wymaganych danych: email, password, role, organizationId.",
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: email,
    });
    
    const permissions = getPermissionsForRole(role);

    await db.collection("users").doc(userRecord.uid).set({
      email: email,
      role: role,
      permissions: permissions,
      organizationId: organizationId,
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Błąd podczas tworzenia użytkownika:", error);
     // Przekształcanie błędów Auth w czytelne komunikaty
    if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'Użytkownik z tym adresem email już istnieje.');
    }
    throw new functions.https.HttpsError("internal", "Wystąpił nieoczekiwany błąd podczas tworzenia użytkownika.");
  }
});

// Funkcja do aktualizacji roli (i uprawnień) użytkownika
export const updateUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musisz być zalogowany, aby modyfikować role.",
    );
  }

  const callerUid = context.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!callerData?.permissions?.canManageUsers) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Nie masz uprawnień do modyfikacji ról.",
    );
  }

  const { userId, role } = data;

  if (!userId || !role) {
      throw new functions.https.HttpsError(
      "invalid-argument",
      "Brak wymaganych danych: userId, role.",
    );
  }

  try {
    const permissions = getPermissionsForRole(role);
    await db.collection("users").doc(userId).update({ role, permissions });
    return { success: true };
  } catch (error) {
    console.error("Błąd podczas aktualizacji roli:", error);
    throw new functions.https.HttpsError("internal", "Wystąpił błąd podczas aktualizacji roli.");
  }
});


// Funkcja do usuwania użytkownika z Auth i Firestore
export const deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musisz być zalogowany, aby usuwać użytkowników."
    );
  }

  const callerUid = context.auth.uid;
  const userToDeleteId = data.userId;

  if (!userToDeleteId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Funkcja musi być wywołana z argumentem 'userId'."
    );
  }
  
  // Zapobieganie samousunięciu
  if (callerUid === userToDeleteId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Nie możesz usunąć własnego konta."
      );
  }

  try {
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.data();

    if (!callerData?.permissions?.canManageUsers) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Nie masz uprawnień do usuwania użytkowników."
      );
    }

    // Usunięcie użytkownika z Firebase Authentication
    await admin.auth().deleteUser(userToDeleteId);
    
    // Usunięcie dokumentu użytkownika z Firestore
    await db.collection("users").doc(userToDeleteId).delete();

    return { success: true, message: `Pomyślnie usunięto użytkownika ${userToDeleteId}` };
  } catch (error: any) {
    console.error("Błąd podczas usuwania użytkownika:", error);
     if (error.code === 'auth/user-not-found') {
        // Jeśli użytkownik nie istnieje w Auth, usuń go z Firestore na wszelki wypadek
        await db.collection("users").doc(userToDeleteId).delete().catch(() => {});
        return { success: true, message: "Użytkownik nie istniał w systemie autentykacji, usunięto pozostałe dane." };
    }
    throw new functions.https.HttpsError(
      "internal",
      "Wystąpił błąd podczas usuwania użytkownika."
    );
  }
});