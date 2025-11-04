import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Funkcja do tworzenia nowego użytkownika w Firebase Auth i zapisu jego danych w Firestore
export const createNewUser = functions.https.onCall(async (data, context) => {
  // Sprawdzenie, czy wywołujący jest zalogowany
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musisz być zalogowany, aby tworzyć użytkowników.",
    );
  }

  // Sprawdzenie uprawnień admina
  const callerUid = context.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.data()?.permissions?.canManageUsers) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Nie masz uprawnień do tworzenia nowych użytkowników.",
    );
  }

  const { email, password, permissions, organizationId } = data;

  if (!email || !password || !permissions || !organizationId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Brak wymaganych danych: email, password, permissions, organizationId.",
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: email,
    });

    await db.collection("users").doc(userRecord.uid).set({
      email: email,
      permissions: permissions,
      organizationId: organizationId,
    });

    console.log(`Admin ${callerUid} created new user ${userRecord.uid}`);
    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error(`Błąd podczas tworzenia użytkownika przez admina ${callerUid}:`, error);
    if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'Użytkownik z tym adresem email już istnieje.');
    }
    throw new functions.https.HttpsError("internal", "Wystąpił nieoczekiwany błąd serwera podczas tworzenia użytkownika.");
  }
});

// Funkcja do aktualizacji uprawnień użytkownika
export const updateUserPermissions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musisz być zalogowany, aby modyfikować uprawnienia.",
    );
  }

  const callerUid = context.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.data()?.permissions?.canManageUsers) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Nie masz uprawnień do modyfikacji uprawnień.",
    );
  }

  const { userId, permissions } = data;

  if (!userId || !permissions) {
      throw new functions.https.HttpsError(
      "invalid-argument",
      "Brak wymaganych danych: userId, permissions.",
    );
  }

  try {
    await db.collection("users").doc(userId).update({ permissions });
    console.log(`Admin ${callerUid} updated permissions for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`Błąd podczas aktualizacji uprawnień dla ${userId} przez admina ${callerUid}:`, error);
    throw new functions.https.HttpsError("internal", "Wystąpił nieoczekiwany błąd serwera podczas aktualizacji uprawnień.");
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
  
  if (callerUid === userToDeleteId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Nie możesz usunąć własnego konta."
      );
  }

  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.data()?.permissions?.canManageUsers) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Nie masz uprawnień do usuwania użytkowników."
    );
  }

  try {
    // Krok 1: Usunięcie użytkownika z Firebase Authentication
    await admin.auth().deleteUser(userToDeleteId);
    
    // Krok 2: Usunięcie dokumentu użytkownika z Firestore
    await db.collection("users").doc(userToDeleteId).delete();

    console.log(`Admin ${callerUid} pomyślnie usunął użytkownika ${userToDeleteId}.`);
    return { success: true, message: `Pomyślnie usunięto użytkownika.` };
  } catch (error: any) {
    console.error(`Błąd podczas usuwania użytkownika ${userToDeleteId} przez admina ${callerUid}:`, error);

    // Obsługa błędu, gdy użytkownik nie istnieje w Auth (np. niespójny stan bazy)
    if (error.code === 'auth/user-not-found') {
        console.warn(`Próba usunięcia nieistniejącego użytkownika Auth: ${userToDeleteId}. Czyszczenie Firestore.`);
        await db.collection("users").doc(userToDeleteId).delete().catch(() => {});
        return { success: true, message: "Użytkownik nie istniał w systemie autentykacji, usunięto pozostałe dane." };
    }

    // Obsługa błędu braku uprawnień konta serwisowego (bardzo ważny!)
    if (error.code === 'auth/insufficient-permission') {
        console.error("BŁĄD KRYTYCZNY: Konto serwisowe Cloud Function nie ma uprawnień do usuwania użytkowników. Sprawdź role IAM (np. 'Firebase Authentication Admin').");
        throw new functions.https.HttpsError(
            "permission-denied",
            "Błąd konfiguracji serwera. Skontaktuj się z administratorem systemu."
        );
    }
    
    // Dla wszystkich innych błędów, zwróć ogólny błąd "internal"
    throw new functions.https.HttpsError(
      "internal",
      "Wystąpił nieoczekiwany błąd serwera podczas usuwania użytkownika."
    );
  }
});