

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Funkcja do tworzenia nowego użytkownika w Firebase Auth i zapisu jego danych w Firestore
export const createNewUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Musisz być zalogowany, aby tworzyć użytkowników.",
    );
  }

  const callerUid = context.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.exists || !callerDoc.data()?.permissions?.canManageUsers) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Tylko administratorzy mogą tworzyć nowych użytkowników.",
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
    throw new functions.https.HttpsError("internal", "Wystąpił błąd serwera podczas tworzenia użytkownika.");
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
  if (!callerDoc.exists || !callerDoc.data()?.permissions?.canManageUsers) {
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
    throw new functions.https.HttpsError("internal", "Wystąpił błąd serwera podczas aktualizacji uprawnień.");
  }
});

async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: admin.firestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve(0);
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    setTimeout(() => {
        deleteQueryBatch(query, resolve);
    }, 0);
}

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
  if (!callerDoc.exists || !callerDoc.data()?.permissions?.canManageUsers) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Nie masz uprawnień do usuwania użytkowników."
    );
  }

  try {
    const collections = await db.collection("users").doc(userToDeleteId).listCollections();
    for (const collection of collections) {
        await deleteCollection(`users/${userToDeleteId}/${collection.id}`, 100);
    }
    
    await db.collection("users").doc(userToDeleteId).delete();
      
    await admin.auth().deleteUser(userToDeleteId);

    console.log(`Admin ${callerUid} pomyślnie usunął użytkownika ${userToDeleteId}.`);
    return { success: true, message: `Pomyślnie usunięto użytkownika.` };
  } catch (error: any) {
    console.error(`Błąd podczas usuwania użytkownika ${userToDeleteId} przez admina ${callerUid}:`, error);

    if (error.code === 'auth/user-not-found') {
        await db.collection("users").doc(userToDeleteId).delete().catch(() => {});
        return { success: true, message: "Użytkownik nie istniał w systemie autentykacji, usunięto pozostałe dane." };
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Wystąpił błąd serwera podczas usuwania użytkownika."
    );
  }
});


// Bezpieczne pobieranie użytkowników z organizacji
export const getOrganizationUsers = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Musisz być zalogowany, aby pobrać listę użytkowników.",
        );
    }

    const callerUid = context.auth.uid;
    const callerDocRef = db.collection("users").doc(callerUid);

    try {
        const callerDoc = await callerDocRef.get();
        if (!callerDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Nie znaleziono Twojego profilu użytkownika.");
        }

        const organizationId = callerDoc.data()?.organizationId;
        if (!organizationId) {
            throw new functions.https.HttpsError("failed-precondition", "Twoje konto nie jest przypisane do organizacji.");
        }
        
        const usersQuery = db.collection('users').where('organizationId', '==', organizationId);
        const querySnapshot = await usersQuery.get();

        const users = querySnapshot.docs.map(doc => {
            const docData = doc.data();
            return {
                docId: doc.id,
                email: docData.email,
                permissions: docData.permissions,
                organizationId: docData.organizationId,
            };
        });
        
        return users;

    } catch (error: any) {
        console.error(`Błąd podczas pobierania użytkowników dla ${callerUid}:`, error);

        if (error.code === 'failed-precondition') {
            console.error("Błąd zapytania Firestore: Prawdopodobnie brakuje wymaganego indeksu. Sprawdź logi, aby znaleźć link do jego utworzenia.");
            throw new functions.https.HttpsError(
                "failed-precondition",
                "Błąd bazy danych: Brak wymaganego indeksu. Sprawdź logi funkcji w Google Cloud, aby znaleźć link do jego utworzenia.",
            );
        }

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Wystąpił błąd serwera podczas pobierania użytkowników.");
    }
});
