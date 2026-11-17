# تطبيق إدارة المدرسة (Expo + SQLite)
## تشغيل وبناء APK
```
npm install
npx expo install --fix          # لمواءمة إصدارات الحزم مع Expo SDK
npx expo start --android        # تجربة سريعة على الهاتف عبر Expo Go (البصمة/الإشعارات تعمل أفضل في build)
npm install -g eas-cli && eas login
eas build:configure
eas build -p android --profile preview   # ينتج رابط تحميل APK
```
بناء محلي: `npx expo prebuild -p android && cd android && ./gradlew assembleRelease` ثم الملف في `android/app/build/outputs/apk/release/`.
## ملاحظات
- أول دخول: admin / 1234 (غيّره من الإعدادات).
- القيم القانونية (نسب الأرباح، الضريبة، الجزاءات، الاستحقاقات) افتراضية وقابلة للتعديل من الإعدادات — راجعها مع القرارات الوزارية السارية.
- نسب توزيع الأرباح والدعم مبدئياً 0% حتى تُدخل القيم المعتمدة.
