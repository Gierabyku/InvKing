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

// Helper function to check for admin privileges, supporting legacy 'isAdmin' flag
const hasAdminPermissions = (
  callerData: admin.firestore.DocumentData | undefined,
): boolean => {
  if (!callerData) return false;
  const hasModernPermission = callerData.permissions?.canManageUsers === true;
  const isLegacyAdmin = callerData.isAdmin === true;
  return hasModernPermission || isLegacyAdmin;
};

// FIX: Define interfaces for callable function data payloads to ensure type safety.
interface CreateUserData {
  email: string;
  password?: string;
  role: string;
  organizationId: string;
}

interface UpdateUserRoleData {
  userId: string;
  role: string;
}

interface DeleteUserData {
  userId: string;
}

// Funkcja do tworzenia nowego użytkownika w Firebase Auth i zapisu jego danych w Firestore
// FIX: Updated function signature to use a single `request` object, which is expected by this version of firebase-functions, to resolve type errors.
export const createNewUser = functions.https.onCall(async (request) => {
  const data: CreateUserData = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musisz być zalogowany, aby tworzyć użytkowników.",
    );
  }

  const callerUid = auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!hasAdminPermissions(callerData)) {
    const diagnosticInfo = {
        message: "Odmowa dostępu. Szczegóły diagnostyczne poniżej.",
        callerUid: callerUid,
        docExists: callerDoc.exists,
        callerData: callerData || "Dokument użytkownika nie istnieje.",
        checkResults: {
            hasModernPermission: callerData?.permissions?.canManageUsers === true,
            isLegacyAdmin: callerData?.isAdmin === true,
        },
    };
    functions.logger.error("Błąd uprawnień - szczegóły:", diagnosticInfo);
    throw new functions.https.HttpsError(
        "permission-denied",
        JSON.stringify(diagnosticInfo, null, 2),
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
    functions.logger.error("Szczegółowy błąd podczas tworzenia użytkownika:", error);
    if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'Użytkownik z tym adresem email już istnieje.');
    }
    const message = error.message || "Wystąpił nieoczekiwany błąd podczas tworzenia użytkownika.";
    throw new functions.https.HttpsError("internal", message, error.details);
  }
});

// Funkcja do aktualizacji roli (i uprawnień) użytkownika
// FIX: Updated function signature to use a single `request` object, which is expected by this version of firebase-functions, to resolve type errors.
export const updateUserRole = functions.https.onCall(async (request) => {
  const data: UpdateUserRoleData = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musisz być zalogowany, aby modyfikować role.",
    );
  }

  const callerUid = auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();
  
  if (!hasAdminPermissions(callerData)) {
    const diagnosticInfo = {
        message: "Odmowa dostępu. Szczegóły diagnostyczne poniżej.",
        callerUid: callerUid,
        docExists: callerDoc.exists,
        callerData: callerData || "Dokument użytkownika nie istnieje.",
    };
    functions.logger.error("Błąd uprawnień - szczegóły:", diagnosticInfo);
    throw new functions.https.HttpsError(
        "permission-denied",
        JSON.stringify(diagnosticInfo, null, 2),
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
    await db.collection("users").doc(userId).update({
        role,
        permissions,
        isAdmin: admin.firestore.FieldValue.delete(), // Clean up legacy field
    });
    return { success: true };
  } catch (error: any) {
    functions.logger.error("Szczegółowy błąd podczas aktualizacji roli:", error);
    const message = error.message || "Wystąpił błąd podczas aktualizacji roli.";
    throw new functions.https.HttpsError("internal", message, error.details);
  }
});


// Funkcja do usuwania użytkownika z Auth i Firestore
// FIX: Updated function signature to use a single `request` object, which is expected by this version of firebase-functions, to resolve type errors.
export const deleteUser = functions.https.onCall(async (request) => {
  const data: DeleteUserData = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musisz być zalogowany, aby usuwać użytkowników."
    );
  }

  const callerUid = auth.uid;
  const userToDeleteId = data.userId;

  if (!userToDeleteId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Funkcja musi być wywołana z argumentem 'userId'."
    );
  }
  
  if (callerUid === userToDeleteId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Nie możesz usunąć własnego konta."
      );
  }

  const callerDoc = await db.collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!hasAdminPermissions(callerData)) {
    const diagnosticInfo = {
        message: "Odmowa dostępu. Szczegóły diagnostyczne poniżej.",
        callerUid: callerUid,
        docExists: callerDoc.exists,
        callerData: callerData || "Dokument użytkownika nie istnieje.",
    };
    functions.logger.error("Błąd uprawnień - szczegóły:", diagnosticInfo);
    throw new functions.https.HttpsError(
        "permission-denied",
        JSON.stringify(diagnosticInfo, null, 2),
    );
  }

  try {
    await admin.auth().deleteUser(userToDeleteId);
    await db.collection("users").doc(userToDeleteId).delete();
    return { success: true, message: `Pomyślnie usunięto użytkownika ${userToDeleteId}` };
  } catch (error: any) {
    functions.logger.error(`Szczegółowy błąd podczas usuwania użytkownika ${userToDeleteId}:`, error);

    if (error.code === 'auth/user-not-found') {
        await db.collection("users").doc(userToDeleteId).delete().catch(() => {});
        return { success: true, message: "Użytkownik nie istniał w systemie autentykacji, usunięto pozostałe dane." };
    }
    
    const message = error.message || "Wystąpił nieznany błąd wewnętrzny podczas usuwania użytkownika.";
    const code = error.code === 'permission-denied' ? 'permission-denied' : 'internal';
    throw new functions.https.HttpsError(code, message, error.details);
  }
});
