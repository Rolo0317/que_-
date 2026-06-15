import { test, expect } from '@playwright/test';

test.describe('Dashboard WFM - Flujo Completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('debe cargar la página principal', async ({ page }) => {
    // Verificar que la página carga
    await expect(page).toHaveTitle(/dashboard|que/i);
    
    // Verificar que se muestran elementos clave
    await expect(page.getByRole('heading', { name: /dashboard de call center/i })).toBeVisible();
  });

  test('debe mostrar KPI cards con indicadores WFM', async ({ page }) => {
    // Verificar que se muestran tarjetas de KPI
    const kpiCards = page.locator('article');
    await expect(kpiCards.first()).toBeVisible();
    
    // Verificar indicadores específicos de WFM
    await expect(page.getByText(/ocupacion/i)).toBeVisible();
    await expect(page.getByText(/utilizacion/i)).toBeVisible();
    await expect(page.getByText(/shrinkage/i)).toBeVisible();
    await expect(page.getByText(/adherencia/i)).toBeVisible();
  });

  test('debe permitir cambiar entre temas claro y oscuro', async ({ page }) => {
    // Buscar botón de tema
    const themeToggle = page.getByRole('button', { name: /modo oscuro|modo claro/i });
    await expect(themeToggle).toBeVisible();
    
    // Verificar tema actual
    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');
    
    // Cambiar tema
    await themeToggle.click();
    
    // Verificar que cambió
    const newClass = await html.getAttribute('class');
    expect(initialClass).not.toBe(newClass);
  });

  test('debe filtrar llamadas por tipo (Inbound/Outbound)', async ({ page }) => {
    // Encontrar select de filtro
    const filterSelect = page.locator('select').first();
    
    // Verificar opciones disponibles
    await filterSelect.selectOption('Inbound');
    await expect(filterSelect).toHaveValue('Inbound');
    
    await filterSelect.selectOption('Outbound');
    await expect(filterSelect).toHaveValue('Outbound');
    
    await filterSelect.selectOption('Todos');
    await expect(filterSelect).toHaveValue('Todos');
  });

  test('debe mostrar logo del dashboard', async ({ page }) => {
    const logo = page.locator('img[alt="QUE+"]').first();
    await expect(logo).toBeVisible();
  });

  test('debe mostrar indicador de estado de API', async ({ page }) => {
    // Verificar que hay indicador de estado
    const apiStatus = page.getByText(/api/i);
    await expect(apiStatus).toBeVisible();
  });

  test('debe mostrar footer con información del proyecto', async ({ page }) => {
    // Scroll al footer
    await page.locator('footer').scrollIntoViewIfNeeded();
    
    // Verificar elementos del footer
    await expect(page.getByText(/wfm|performance|agentes/i)).toBeVisible();
  });

  test('debe cargar datos demo inicialmente', async ({ page }) => {
    // Verificar mensaje de estado inicial
    await expect(page.getByText(/datos demo cargados/i)).toBeVisible();
  });

  test('debe permitir cargar archivo Excel', async ({ page }) => {
    // Buscar botón de carga de archivo
    const uploadButton = page.getByRole('button', { name: /cargar|excel|upload/i });
    await expect(uploadButton).toBeVisible();
  });

  test('debe mostrar gráficas de datos', async ({ page }) => {
    // Esperar a que se carguen las gráficas
    await page.waitForTimeout(1000);
    
    // Buscar elementos SVG de gráficas (Recharts)
    const charts = page.locator('svg');
    const count = await charts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('debe tener animaciones suaves en KPI cards', async ({ page }) => {
    const firstKpi = page.locator('article').first();
    
    // Hover sobre card
    await firstKpi.hover();
    
    // Verificar que es visible después del hover
    await expect(firstKpi).toBeVisible();
  });

  test('debe responder a cambios de filtro', async ({ page }) => {
    const filterSelect = page.locator('select').first();
    const initialValue = await filterSelect.inputValue();
    
    // Cambiar filtro
    await filterSelect.selectOption('Inbound');
    const newValue = await filterSelect.inputValue();
    
    // Verificar cambio
    expect(newValue).not.toBe(initialValue);
  });

  test('debe mostrar todos los indicadores WFM principales', async ({ page }) => {
    const indicadores = [
      'Total llamadas',
      'Inbound',
      'Outbound',
      'SLA',
      'Abandono',
      'ASA',
      'AHT',
      'Ocupacion',
      'Utilizacion',
      'Shrinkage',
      'Adherencia',
      'Asistencia',
    ];
    
    for (const indicator of indicadores) {
      const element = page.getByText(new RegExp(indicator, 'i'));
      await expect(element).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Configuración para despliegue en Vercel', () => {
  test('debe estar disponible en puerto 5173 en dev', async ({ page }) => {
    // Verificar que la URL está correcta
    const url = page.url();
    expect(url).toContain('localhost:5173');
  });

  test('debe tener metadatos correctos', async ({ page }) => {
    const title = await page.title();
    expect(title).toMatch(/que|dashboard/i);
  });
});
