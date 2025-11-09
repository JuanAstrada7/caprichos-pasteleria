const bcrypt = require('bcrypt');
const saltRounds = 10;
const plainPassword = 'admin123';

bcrypt.hash(plainPassword, saltRounds, function (err, hash) {
    if (err) {
        console.error("Error al generar el hash:", err);
        return;
    }
    console.log('Tu contraseña en texto plano es:', plainPassword);
    console.log('Tu HASH seguro es (cópialo en tu .env):');
    console.log(hash);
});
