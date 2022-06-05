# ithinka-api
Veritabanı ayarları config/default.json gerçekleştirilir.

`npm run develop`

İlk kurulumda Admin ve User izin gruplarını oluşturmak için kodu çalıştırın.

`npx foal run create-group-perm`

Admin kullanıcısı.
`npx foal run create-user groups="[\"Admin\"]" email="admin@admin.com" password="123456"`

User Kullanıcısı.

`npx foal run create-user groups="[\"User\"]" email="user@user.com" password="123456"`
