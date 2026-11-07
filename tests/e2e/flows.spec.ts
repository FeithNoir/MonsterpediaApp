import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { mkdirSync, writeFileSync } from 'node:fs';
if (
  process.env['FIRESTORE_EMULATOR_HOST'] !== '127.0.0.1:8080' ||
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] !== '127.0.0.1:9099'
)
  throw new Error('These tests must run under the local Firebase emulators.');
const app = getApps()[0] || initializeApp({ projectId: 'mosterpedia' });
const db = getFirestore(app);
const auth = getAuth(app);
const stamp = Timestamp.fromMillis(1794084000000);
const entry = (name: string, authorId = 'alice') => ({
  name,
  description:
    'Una presencia singular entre las notas de los viajeros. Su rastro une los bosques antiguos con la memoria de quienes los habitan.',
  species: 'Criatura legendaria',
  alignment: 'Neutral',
  longevity: 'Desconocida',
  commonNames: ['Guardián del bosque'],
  clasification: ['Tradición oral', 'Bestiario'],
  tags: ['bosque', 'leyenda'],
  images: [],
  threatLevel: 7,
  content:
    '## Hábitat y observaciones\nSe ha documentado su presencia en las quebradas y los senderos del bosque. Prefiere las horas en que la niebla cubre la montaña.\n\nLos registros más antiguos hablan de una criatura cautelosa, que evita el encuentro con los viajeros. Sus señales se reconocen en las piedras junto al agua.\n\n## Notas del naturalista\nConviene observar desde lejos y dejar intacto el lugar del hallazgo. Cada avistamiento añade una nueva página al archivo.\n\n> No confundas el silencio del bosque con la ausencia de vida.',
  authorId,
  displayName: authorId === 'alice' ? 'Alicia de Campo' : 'Otro Naturalista',
  createdAt: stamp,
  updatedAt: stamp,
  version: 1,
});
let errors: string[] = [];
async function login(page: Page, who = 'alice') {
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill(`${who}@example.test`);
  await page.getByLabel('Contraseña', { exact: true }).fill('EmulatorOnly123!');
  await page
    .getByRole('button', { name: 'Entrar al cuaderno', exact: true })
    .click();
  await expect(page).not.toHaveURL(/\/auth/);
}
async function capture(page: Page, name: string, project: string) {
  await page.evaluate(() => document.fonts.ready);
  mkdirSync('docs/screenshots', { recursive: true });
  await page.screenshot({
    path: `docs/screenshots/after-${name}-${project}.png`,
    fullPage: true,
  });
}
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  for (const uid of ['alice', 'bob', 'root', 'visitor']) {
    try {
      await auth.getUser(uid);
    } catch {
      await auth.createUser({
        uid,
        email: `${uid}@example.test`,
        password: 'EmulatorOnly123!',
        emailVerified: uid !== 'visitor',
        displayName:
          uid === 'root' ? 'Administración del Archivo' : 'Alicia de Campo',
      });
    }
  }
  await db.recursiveDelete(db.collection('entries'));
  await db.doc('admins/root').set({ enabled: true });
  const b = db.batch();
  for (const [id, name, owner] of [
    ['alicanto', 'Alicanto', 'alice'],
    ['basilisco', 'Basilisco', 'alice'],
    ['grifo', 'Grifo', 'bob'],
  ])
    b.set(db.doc(`entries/${id}`), entry(name, owner));
  await b.commit();
});
test.afterEach(async ({ page }, info) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow, 'no horizontal overflow').toBe(false);
  expect(errors, 'zero browser console/page errors').toEqual([]);
  writeFileSync(info.outputPath('console-errors.json'), JSON.stringify(errors));
});
test('public reading, search URLs, empty states, SEO and accessible folio', async ({
  page,
}, info) => {
  await page.goto('/home');
  await expect(page.locator('app-specimen')).toBeVisible();
  const dailyName = await page.locator('h1').textContent();
  await page.reload();
  await expect(page.locator('h1')).toHaveText(dailyName!);
  await capture(page, 'home', info.project.name);
  const homeAxe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(homeAxe.violations).toEqual([]);
  await page.goto('/article/basilisco');
  await expect(page.locator('h1')).toHaveText('Basilisco');
  await expect(page.getByRole('link', { name: 'Editar ficha' })).toHaveCount(0);
  await expect(page).toHaveTitle('Monsterpedia · Basilisco');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Una presencia singular/,
  );
  await capture(page, 'article', info.project.name);
  const articleAxe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(articleAxe.violations).toEqual([]);
  await page.goto('/wiki-articles?q=basi');
  await expect(page.locator('.catalog-list h2')).toHaveText(['Basilisco']);
  await db
    .doc('entries/malformed')
    .set({ description: null, tags: null, commonNames: null });
  await page.getByLabel('Buscar en el bestiario').fill('imposible');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/q=imposible/);
  await expect(page.getByText('No encontramos esa huella.')).toBeVisible();
  await capture(page, 'index-empty', info.project.name);
  await page.goto('/article/missing');
  await expect(page.locator('h1')).toContainText('Esta página no está');
  await page.goto('/unrecorded');
  await expect(page.locator('h1')).toContainText('Esta página no está');
  await page.goto('/auth');
  await expect(page.locator('h1')).toContainText('Volver a las notas');
  await capture(page, 'auth', info.project.name);
  await page.goto('/reset-password');
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await capture(page, 'reset', info.project.name);
});
test('normal user restores deep links, uploads real images and saves revision history', async ({
  page,
}, info) => {
  await page.goto('/entry');
  await expect(page).toHaveURL(/auth\?returnUrl=/);
  await login(page);
  await expect(page).toHaveURL(/\/entry$/);
  await page
    .getByRole('button', { name: 'Publicar ficha', exact: true })
    .click();
  await expect(
    page.getByText('Escribe el nombre (máximo 120 caracteres).'),
  ).toBeVisible();
  await page.getByLabel('Nombre de la criatura').fill('Espécimen de prueba');
  await page
    .getByLabel('Nota de presentación')
    .fill('Registro de prueba para verificar la publicación y el historial.');
  await page.getByLabel('Especie', { exact: false }).fill('Ave legendaria');
  await page
    .getByLabel('Notas del espécimen')
    .fill('## Hallazgo\nEsta ficha permite verificar el flujo completo.');
  await page
    .getByLabel('Adjuntar una lámina')
    .setInputFiles({
      name: 'plate.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP7sAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  await expect(page.getByAltText('Vista previa 1')).toBeVisible();
  await expect(
    page.getByText('Guardando la lámina en el archivo…'),
  ).toHaveCount(0);
  await capture(page, 'editor-user', info.project.name);
  await page
    .getByRole('button', { name: 'Publicar ficha', exact: true })
    .click();
  await expect(page).toHaveURL(/\/article\//);
  await expect(page.locator('h1')).toHaveText('Espécimen de prueba');
  const id = page.url().split('/').pop();
  const saved = (await db.doc(`entries/${id}`).get()).data()!;
  expect(saved['authorId']).toBe('alice');
  expect(saved).not.toHaveProperty('author');
  expect(saved['images'][0]).toContain('127.0.0.1:9199');
  await page.getByRole('link', { name: 'Editar ficha' }).click();
  await expect(page).toHaveURL(new RegExp(`/entry/${id}$`));
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`/entry/${id}$`));
  await expect(page.getByLabel('Nombre de la criatura')).toHaveValue(
    'Espécimen de prueba',
  );
  await page.getByLabel('Nombre de la criatura').fill('Espécimen revisado');
  await page
    .getByRole('button', { name: 'Guardar revisión', exact: true })
    .click();
  await expect(page.locator('h1')).toHaveText('Espécimen revisado');
  await expect(page.locator('summary')).toContainText('Versión 1');
  const updated = (await db.doc(`entries/${id}`).get()).data()!;
  expect(updated['authorId']).toBe(saved['authorId']);
  expect(updated['createdAt'].isEqual(saved['createdAt'])).toBe(true);
  expect(updated['version']).toBe(2);
  await page.goto('/entry/grifo');
  await expect(page.locator('h1')).toContainText('otra autoría');
  await page.goto('/dashboard');
  await expect(
    page.getByRole('button', { name: 'Eliminar', exact: true }),
  ).toHaveCount(0);
  await capture(page, 'dashboard-user', info.project.name);
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Abrir navegación' }).click();
    await expect(
      page.getByRole('link', { name: 'Nueva ficha', exact: true }),
    ).toBeVisible();
    await capture(page, 'menu-user', info.project.name);
  }
});
test('admin role document enables foreign edits and deletes only after confirmation', async ({
  page,
}, info) => {
  await page.goto('/entry/grifo');
  await login(page, 'root');
  await expect(page.getByLabel('Nombre de la criatura')).toHaveValue('Grifo');
  await page.getByLabel('Nombre de la criatura').fill('Grifo revisado');
  await page.getByRole('button', { name: 'Guardar revisión' }).click();
  await expect(page.locator('h1')).toHaveText('Grifo revisado');
  expect((await db.doc('entries/grifo').get()).data()!['authorId']).toBe('bob');
  await page.goto('/dashboard');
  await expect(
    page.getByRole('button', { name: 'Eliminar', exact: true }),
  ).toHaveCount(3);
  await capture(page, 'dashboard-admin', info.project.name);
  await page
    .getByRole('button', { name: 'Eliminar', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Confirmar eliminación' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect((await db.collection('entries').get()).size).toBe(3);
  await page
    .getByRole('button', { name: 'Eliminar', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Confirmar eliminación' }).click();
  await expect(
    page.getByRole('button', { name: 'Eliminar', exact: true }),
  ).toHaveCount(2);
});
test('unverified user receives a profile explanation rather than editor access', async ({
  page,
}) => {
  await page.goto('/entry');
  await login(page, 'visitor');
  await expect(page).toHaveURL(/\/profile/);
  await expect(
    page.getByText('Tu correo aún no está verificado.', { exact: false }),
  ).toBeVisible();
  await page.goto('/entry/basilisco');
  await expect(page).toHaveURL(/\/profile\?verify=1/);
});
test('conflicting edits preserve a draft and dirty navigation can be cancelled', async ({
  page,
}) => {
  await page.goto('/entry/basilisco');
  await login(page);
  await expect(page.getByLabel('Nombre de la criatura')).toHaveValue(
    'Basilisco',
  );
  await page.getByLabel('Nombre de la criatura').fill('Mi borrador local');
  await db
    .doc('entries/basilisco')
    .update({ name: 'Versión remota', version: 2, updatedAt: Timestamp.now() });
  await page.getByRole('button', { name: 'Guardar revisión' }).click();
  await expect(
    page.getByText('Otra persona actualizó esta ficha.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel('Nombre de la criatura')).toHaveValue(
    'Mi borrador local',
  );
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('link', { name: 'Volver al cuaderno' }).click();
  await expect(page).toHaveURL(/\/entry\/basilisco$/);
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Cargar la versión del archivo' })
    .click();
  await expect(page.getByLabel('Nombre de la criatura')).toHaveValue(
    'Versión remota',
  );
});
test('registration verification, profile and reset forms keep success feedback', async ({
  page,
}, info) => {
  await page.goto('/auth');
  await page
    .getByRole('button', { name: 'Crear una cuenta', exact: true })
    .click();
  await page
    .getByLabel('Nombre público (sin correo)')
    .fill('Naturalista Nueva');
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill(`new-${info.project.name}@example.test`);
  await page.getByLabel('Contraseña', { exact: true }).fill('EmulatorOnly123!');
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page).toHaveURL(/\/profile\?registered=1/);
  await expect(
    page.getByText('Cuenta creada.', { exact: false }),
  ).toBeVisible();
  const user = await auth.getUserByEmail(
    `new-${info.project.name}@example.test`,
  );
  await auth.updateUser(user.uid, { emailVerified: true });
  await page.getByRole('button', { name: 'Ya verifiqué mi correo' }).click();
  await expect(
    page.getByText('Correo verificado. Ya puedes escribir.'),
  ).toBeVisible();
  await page.getByLabel('Cambiar nombre público').fill('Naturalista del Valle');
  await page.getByRole('button', { name: 'Guardar nombre' }).click();
  await expect(
    page.getByText('Nombre público actualizado.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel('Cambiar nombre público')).toBeEmpty();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.goto('/reset-password');
  await page.getByLabel('Correo electrónico').fill('alice@example.test');
  await page.getByRole('button', { name: 'Solicitar enlace' }).click();
  await expect(
    page.getByText(
      'Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu acceso.',
    ),
  ).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toBeEmpty();
  await expect(page.getByText('Escribe un correo válido.')).toHaveCount(0);
});
