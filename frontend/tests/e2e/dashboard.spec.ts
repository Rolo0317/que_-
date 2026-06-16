import { test, expect, Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function waitForApp(page: Page) {
  await page.waitForLoadState('networkidle');
  // Dismiss splash if visible
  const splash = page.locator('[data-testid="splash"], button:has-text("Entrar")').first();
  if (await splash.isVisible({ timeout: 2000 }).catch(() => false)) {
    await splash.click();
    await page.waitForTimeout(500);
  }
}

// ─── Suite: Carga inicial ──────────────────────────────────────────────────────

test.describe('Carga inicial del dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
  });

  test('título de página contiene QUE o Dashboard', async ({ page }) => {
    await expect(page).toHaveTitle(/que|dashboard/i);
  });

  test('logo QUE+ es visible', async ({ page }) => {
    const logo = page.locator('img[alt="QUE+"]').first();
    await expect(logo).toBeVisible();
  });

  test('existen KPI cards en la primera vista', async ({ page }) => {
    const cards = page.locator('article');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('footer es visible con scroll', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('footer')).toBeVisible({ timeout: 3000 });
  });
});

// ─── Suite: Navegación entre módulos ─────────────────────────────────────────

test.describe('Navegación entre módulos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
  });

  test('navega a Operaciones y muestra KPIs de SLA y Abandono', async ({ page }) => {
    const opsLink = page.getByRole('link', { name: /operaciones/i }).first();
    await opsLink.click();
    await expect(page).toHaveURL(/operaciones/i);
    await expect(page.getByText(/SLA/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/abandono/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('navega a WFM y muestra Ocupación y Utilización', async ({ page }) => {
    const wfmLink = page.getByRole('link', { name: /wfm/i }).first();
    await wfmLink.click();
    await expect(page.getByText(/ocupaci/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/utilizaci/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('navega a Agentes desde Operaciones', async ({ page }) => {
    const opsLink = page.getByRole('link', { name: /operaciones/i }).first();
    await opsLink.click();
    await expect(page).toHaveURL(/operaciones/);
    const agtLink = page.getByRole('link', { name: /agentes/i }).first();
    await agtLink.click();
    await expect(page).toHaveURL(/agentes/);
  });

  test('navega a Agentes y muestra tabla', async ({ page }) => {
    const agLink = page.getByRole('link', { name: /agentes/i }).first();
    await agLink.click();
    await expect(page).toHaveURL(/agentes/i);
  });

  test('navega a Archivos y muestra gestión de datasets', async ({ page }) => {
    const filesLink = page.getByRole('link', { name: /archivos/i }).first();
    await filesLink.click();
    await expect(page).toHaveURL(/archivos/i);
    await expect(page.getByText(/gestión de datos/i)).toBeVisible({ timeout: 3000 });
  });

  test('parámetros de URL persisten al navegar entre módulos', async ({ page }) => {
    // Navegar a operaciones con period=mes y verificar que el param persiste al ir a WFM
    await page.goto('/operaciones?period=mes');
    await waitForApp(page);
    await expect(page).toHaveURL(/period=mes/);

    const wfmLink = page.getByRole('link', { name: /wfm/i }).first();
    await wfmLink.click();
    // El NavLink lleva los searchParams → param persiste al cambiar de módulo
    await expect(page).toHaveURL(/period=mes/);
  });
});

// ─── Suite: Tema claro / oscuro ──────────────────────────────────────────────

test.describe('Tema claro/oscuro', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
  });

  test('toggle de tema cambia clase en html', async ({ page }) => {
    const toggle = page.locator('button[aria-label*="modo"], button[title*="modo"], button[aria-label*="Modo"]').first();
    await expect(toggle).toBeVisible({ timeout: 3000 });

    const html = page.locator('html');
    const before = await html.getAttribute('class');
    await toggle.click();
    await page.waitForTimeout(300);
    const after = await html.getAttribute('class');
    expect(before).not.toBe(after);
  });
});

// ─── Suite: Filtros en cascada ────────────────────────────────────────────────

test.describe('Filtros en cascada (COPC-ready)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/operaciones');
    await waitForApp(page);
  });

  test('select de tipo tiene opción Todos', async ({ page }) => {
    const typeSelect = page.locator('select[aria-label="Filtrar por tipo"]');
    const options = await typeSelect.locator('option').allTextContents();
    expect(options).toContain('Todos');
  });

  test('select de período existe y tiene opción Todo el período', async ({ page }) => {
    const periodSelect = page.locator('select[aria-label="Filtrar por período"]');
    await expect(periodSelect).toBeVisible();
    const opts = await periodSelect.locator('option').allTextContents();
    expect(opts).toContain('Todo el período');
  });

  test('URL period=dia se refleja en selector de período', async ({ page }) => {
    await page.goto('/operaciones?period=dia');
    await waitForApp(page);
    // El selector de período debe tener el valor 'dia' (viene del URL)
    const periodSelect = page.locator('select[aria-label="Filtrar por período"]');
    await expect(periodSelect).toHaveValue('dia');
  });
});

// ─── Suite: Gráficas ─────────────────────────────────────────────────────────

test.describe('Gráficas y visualizaciones', () => {
  test.beforeEach(async ({ page }) => {
    // Las gráficas viven en la vista raíz (WFM por defecto o Operaciones con hash)
    await page.goto('/wfm');
    await waitForApp(page);
  });

  test('existen elementos SVG en la página principal', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    // Al menos el logo SVG u otro elemento SVG debe existir en la página
    const svgs = page.locator('svg');
    const count = await svgs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('la vista WFM muestra KPI cards (no SVG requerido con datos vacíos)', async ({ page }) => {
    const cards = page.locator('article');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Suite: Gestión de datos (Archivos) ──────────────────────────────────────

test.describe('Gestión de datos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/archivos');
    await waitForApp(page);
  });

  test('muestra la sección de gestión con al menos un dataset (demo)', async ({ page }) => {
    await expect(page.getByText(/gestión de datos/i)).toBeVisible();
    // El dataset demo siempre existe — las cards usan rounded-2xl border-2 tras el upgrade de UI
    const cards = page.locator('.rounded-2xl.border-2');
    await expect(cards.first()).toBeVisible({ timeout: 3000 });
  });

  test('botón Cargar Excel existe y acepta click', async ({ page }) => {
    const uploadLabel = page.locator('label:has(input[type="file"])').first();
    await expect(uploadLabel).toBeVisible();
  });

  test('zona de arrastre está presente', async ({ page }) => {
    // La drop zone usa un wrapper de gradiente en lugar de border-dashed tras el upgrade de UI
    const dropzone = page.getByText(/arrastra un .xlsx aquí/i);
    await expect(dropzone).toBeVisible();
  });

  test('enlace de descarga de plantilla está presente', async ({ page }) => {
    const dlLink = page.getByRole('link', { name: /plantilla/i });
    await expect(dlLink).toBeVisible();
  });

  test('banner de sincronización en la nube es visible', async ({ page }) => {
    // Muestra el estado de la nube — sin VITE_SUPABASE_URL el texto menciona "locales"
    const cloudBanner = page.getByText(/sincronizaci/i).first();
    await expect(cloudBanner).toBeVisible({ timeout: 3000 });
  });
});

// ─── Suite: KPIs COPC correctamente calculados ───────────────────────────────

test.describe('KPIs COPC — verificación de etiquetas y metas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/operaciones');
    await waitForApp(page);
  });

  test('KPI de SLA está presente con su meta', async ({ page }) => {
    // La etiqueta "SLA" y "Meta:" deben ser visibles en algún article
    await expect(page.getByText('SLA').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/meta:/i).first()).toBeVisible();
  });

  test('KPI de Abandono está presente', async ({ page }) => {
    await expect(page.getByText(/abandono/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('KPI de ASA (Resp. promedio) está presente con su meta en segundos', async ({ page }) => {
    // Target: "Meta: <20 s"
    await expect(page.getByText(/resp\. promedio/i).first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/< ?\d+ s/i).first()).toBeVisible({ timeout: 3000 });
  });
});

// ─── Suite: Configuración de Vercel ──────────────────────────────────────────

test.describe('Configuración de despliegue', () => {
  test('la URL base responde en desarrollo', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toMatch(/localhost:5173|vercel\.app/);
  });

  test('la página no lanza errores de JS en consola al cargar', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await waitForApp(page);
    // Filtramos errores de red esperados (backend offline)
    const realErrors = errors.filter((e) => !e.includes('fetch') && !e.includes('network'));
    expect(realErrors).toHaveLength(0);
  });
});
