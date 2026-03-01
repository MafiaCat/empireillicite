# 📱 Instructions pour votre Application Native iOS

Votre jeu est maintenant prêt à être transformé en une véritable application iPhone.

## 1. Installation Initial (Xcode)
Puisque vous êtes sur Mac, voici les étapes à suivre :
1. **Ouvrez Xcode** sur votre Mac.
2. Choisissez **"Open a project or file"** et sélectionnez le dossier `ios` qui se trouve dans votre dossier de jeu.
3. Branchez votre **iPhone** à votre Mac via USB.
4. Dans Xcode, sélectionnez votre iPhone dans la barre en haut (à côté du bouton Play).
5. Cliquez sur le bouton **Play (▶️)**.
6. *Note : Si c'est votre première fois, vous devrez peut-être aller dans 'Signing & Capabilities' dans Xcode pour ajouter votre compte Apple (gratuit).*

## 2. Mises à jour en direct (Direct Update)
Pour que mes modifications ici apparaissent instantanément sur votre téléphone :

### Option A : Développement (Câble USB)
Gardez votre iPhone branché et Xcode ouvert. À chaque fois que je modifie le code, il suffit de cliquer sur "Play" dans Xcode pour voir les changements.

### Option B : Vrai "Direct Update" (Via Internet)
1. Créez un compte sur **Vercel.com**.
2. Liez votre dossier de jeu à un dépôt **GitHub**.
3. Une fois que vous avez une URL (ex: `https://mon-jeu.vercel.app`), dites-le moi.
4. Je mettrai à jour le fichier `capacitor.config.json` pour pointer vers cette URL.
5. **Dès lors, chaque changement que je ferai sera visible sur votre application dès que vous la relancerez, sans passer par Xcode !**

## 3. Dossiers créés
- `ios/` : Le projet natif Xcode.
- `www/` : Les fichiers web synchronisés pour l'application.
- `package.json` : La configuration des outils.
