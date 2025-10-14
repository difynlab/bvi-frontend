# 🔍 DIAGNÓSTICO DEL SELECTOR DE FUENTES - INSTRUCCIONES

## 📋 **Pasos para Diagnosticar el Problema**

He agregado código de debugging temporal al `RichTextEditor.jsx`. Ahora sigue estos pasos:

### **1. Abrir la Aplicación**
- Ejecuta la aplicación (`npm run dev` o similar)
- Abre las **DevTools** del navegador (F12)
- Ve a la pestaña **Console**

### **2. Ir a una Sección con WYSIWYG**
- Ve a **Events**, **Notices**, **Newsletters** o **Legislation**
- Abre un modal de creación o edición
- El editor WYSIWYG debería aparecer

### **3. Verificar Logs de Inicialización**
En la consola deberías ver:
```
🔍 DIAGNÓSTICO Editor creado exitosamente
Extensiones cargadas: [array de extensiones]
TextStyle disponible: [objeto o undefined]
Marks disponibles: [objeto con todas las marcas]
```

### **4. Seleccionar Texto y Cambiar Fuente**
- Escribe algo en el editor
- Selecciona el texto
- Cambia la fuente en el selector

### **5. Verificar Logs de Cambio**
Deberías ver:
```
🔍 DIAGNÓSTICO onChange ejecutándose...
Valor seleccionado: [valor]
Editor disponible: true
Editor enfocado: true
Valor procesado: [valor]
Chain creado: true
🔍 Aplicando marca textStyle con fontFamily: [valor]
Resultado setMark: true/false
Atributos después de aplicar: [objeto]
HTML generado: [HTML con estilos]
```

### **6. Verificar Logs de Sincronización**
También deberías ver:
```
🔍 DIAGNÓSTICO syncAttrs ejecutándose...
Editor disponible: true
Extensiones disponibles: [array]
Atributos textStyle: [objeto]
Font family encontrada: [valor o undefined]
```

## 🎯 **Qué Buscar en los Logs**

### **✅ Casos Normales:**
- `Editor creado exitosamente` ✅
- `TextStyle disponible: [objeto]` ✅
- `onChange ejecutándose...` ✅
- `Resultado setMark: true` ✅
- `Atributos después de aplicar: {fontFamily: "valor"}` ✅

### **❌ Problemas Posibles:**

#### **Problema 1: Extensión TextStyle No Cargada**
```
TextStyle disponible: undefined
```
**Solución:** Problema con la importación o configuración de TextStyle

#### **Problema 2: onChange No Se Ejecuta**
```
// No aparece: 🔍 DIAGNÓSTICO onChange ejecutándose...
```
**Solución:** Problema con el event handler del select

#### **Problema 3: setMark Falla**
```
Resultado setMark: false
```
**Solución:** Problema con la aplicación de la marca

#### **Problema 4: Atributos No Se Aplican**
```
Atributos después de aplicar: {}
```
**Solución:** La marca se aplica pero no persiste

#### **Problema 5: HTML Sin Estilos**
```
HTML generado: <p>Texto sin estilos</p>
```
**Solución:** Los estilos no se están generando en el HTML

## 🔧 **Comandos Adicionales para la Consola**

Si necesitas más información, ejecuta estos comandos en la consola:

```javascript
// Verificar el editor
console.log('Editor:', window.editor || 'No disponible')

// Verificar extensiones
console.log('Extensiones:', editor?.extensionManager?.extensions)

// Verificar schema
console.log('Schema marks:', editor?.schema?.marks)

// Verificar selección actual
console.log('Selección:', editor?.state?.selection)

// Verificar atributos actuales
console.log('Atributos:', editor?.getAttributes('textStyle'))

// Probar aplicar fuente manualmente
editor?.chain().focus().setMark('textStyle', { fontFamily: 'Arial' }).run()
```

## 📊 **Reportar Resultados**

Después de hacer las pruebas, reporta:

1. **¿Qué logs aparecen?** (copia y pega los logs)
2. **¿Cuál es el primer log que NO aparece?** (indica dónde falla)
3. **¿El HTML generado incluye estilos de fuente?**
4. **¿El selector cambia visualmente cuando seleccionas una opción?**

## 🚨 **Problemas Más Comunes**

### **1. TextStyle No Disponible**
- **Causa:** Conflicto con StarterKit o importación incorrecta
- **Síntoma:** `TextStyle disponible: undefined`

### **2. Valores con Comillas**
- **Causa:** `'Public Sans'` causa problemas de parsing
- **Síntoma:** `Resultado setMark: false`

### **3. Editor No Enfocado**
- **Causa:** El editor no tiene foco cuando se aplica el cambio
- **Síntoma:** `Editor enfocado: false`

### **4. Race Condition**
- **Causa:** El editor no está completamente inicializado
- **Síntoma:** `Editor disponible: false`

---

**Una vez que tengas los logs, podremos identificar exactamente dónde está el problema y solucionarlo.**
