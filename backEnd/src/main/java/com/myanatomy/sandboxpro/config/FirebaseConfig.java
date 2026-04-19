package com.myanatomy.sandboxpro.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initFirebase() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                // Try to load service account from classpath
                InputStream serviceAccount = getClass().getClassLoader()
                        .getResourceAsStream("firebase-service-account.json");

                if (serviceAccount != null) {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .build();
                    FirebaseApp.initializeApp(options);
                    System.out.println("Firebase Admin SDK initialized from service account file.");
                } else {
                    // Fallback: initialize with project ID only (for token verification using public keys)
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.getApplicationDefault())
                            .setProjectId("smartfoodapp-b1431")
                            .build();
                    FirebaseApp.initializeApp(options);
                    System.out.println("Firebase Admin SDK initialized with application default credentials.");
                }
            }
        } catch (IOException e) {
            System.err.println("Firebase Admin SDK initialization failed: " + e.getMessage());
            System.err.println("Phone verification will use fallback mode.");
        }
    }
}
