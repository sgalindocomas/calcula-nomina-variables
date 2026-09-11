# Implementación de i18n Completada

Se ha implementado el sistema de multi-idioma (Catalán como predeterminado y Castellano como secundario), logrando la traducción completa de todas las páginas y textos generados.

## Resumen de cambios

1. **Traducción de StepNomina (Calculadora)**:
   - Se ha migrado `StepNomina.svelte` al uso de la función `t` para todo el texto de la interfaz y los conceptos de la nómina simulada.
   - Se han traducido los mensajes de advertencia, las opciones avanzadas, y los desgloses de devengos y deducciones.

2. **Traducción de Generadores de Texto (Reclamaciones / Información)**:
   - Se modificó `src/lib/text-generators.js` para recibir y utilizar la función `t` que extrae el idioma actual.
   - Las plantillas de reclamación e información se han traducido completamente (Catalán / Castellano) y ahora renderizan correctamente los conceptos, meses, y formato local.

3. **Traducción de CED (Complemento Especial de Dedicación)**:
   - Se ha refactorizado `src/pages/Ced.svelte` inyectando el selector de idioma en la cabecera.
   - Todo el contenido de la interfaz (instrucciones, tabla de meses, botones y alertas de la lógica de evaluación) ha sido extraído a los diccionarios y utilizado a través de `t`.
   - **PDF Generado**: La función de generación de PDF se actualizó para traducir las columnas, estados, títulos e información. 

## Validación
- `npm run build` ejecutado satisfactoriamente. Todas las traducciones funcionan a través de la reactividad integrada de Svelte 5 y de localStorage.
