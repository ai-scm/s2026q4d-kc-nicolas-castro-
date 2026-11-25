const express = require('express');
const { auth, requiresAuth } = require('express-openid-connect');

const app = express();

// Crea automáticamente las rutas /login, /callback y /logout.
app.use(auth({
  issuerBaseURL: process.env.KEYCLOAK_ISSUER,
  baseURL: process.env.BASE_URL,
  clientID: process.env.KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  secret: process.env.SESSION_SECRET,
  authRequired: false,     // la portada es pública
  idpLogout: true,         // /logout también cierra la sesión en Keycloak
  authorizationParams: {
    response_type: 'code', // Authorization Code flow
    scope: 'openid profile email',
  },
}));

const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Portada pública
app.get('/', (req, res) => {
  if (req.oidc.isAuthenticated()) return res.redirect('/hola');
  res.send('<h1>App dummy con Keycloak</h1><a href="/login">Iniciar sesión</a>');
});

// Página protegida: requiere login en Keycloak
app.get('/hola', requiresAuth(), (req, res) => {
  const u = req.oidc.user; // claims del ID token
  const nombre = u.name || u.preferred_username || u.email;
  res.send(`<h1>Hola Mundo, ${escapeHtml(nombre)}</h1><a href="/logout">Cerrar sesión</a>`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App escuchando en ${process.env.BASE_URL}`));