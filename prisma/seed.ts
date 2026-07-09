import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const courses = [
    {
      slug: 'algebra-basica',
      title: 'Álgebra Básica',
      description: 'Ecuaciones lineales, sistemas 2×2 y factorización desde cero con ejemplos reales.',
      area: 'Matemáticas',
      level: 'Básico',
      isPremium: false,
      order: 1,
      emoji: '🔢',
      units: [
        {
          slug: 'ecuaciones-lineales',
          title: 'Ecuaciones lineales',
          order: 1,
          isPremium: false,
          content: `## Ecuaciones lineales
Una ecuación lineal tiene la forma **ax + b = c**, donde x es la incógnita.

### Método de resolución
1. Mover todos los términos con x al lado izquierdo
2. Mover constantes al lado derecho
3. Dividir entre el coeficiente de x

### Ejemplo
Resolver: **3x + 7 = 22**

- Restamos 7: 3x = 15
- Dividimos entre 3: x = 5

### Verificación
Siempre sustituye tu resultado: 3(5) + 7 = 15 + 7 = 22 ✓`,
          problems: [
            {
              title: 'Ecuación simple',
              statement: 'Resuelve para x: 2x + 5 = 13',
              difficulty: 'easy',
              isPremium: false,
              answer: 'x = 4',
              steps: [
                { step: 1, explanation: 'Restamos 5 en ambos lados', expression: '2x + 5 - 5 = 13 - 5', result: '2x = 8' },
                { step: 2, explanation: 'Dividimos entre 2 en ambos lados', expression: '2x ÷ 2 = 8 ÷ 2', result: 'x = 4' },
                { step: 3, explanation: 'Verificamos: 2(4) + 5 = 8 + 5 = 13 ✓', expression: '2(4) + 5', result: '13 ✓' },
              ],
              hints: ['Pasa el 5 restando al otro lado', 'Después divide entre el coeficiente de x'],
            },
            {
              title: 'Ecuación con fracciones',
              statement: 'Resuelve: x/3 + 4 = 7',
              difficulty: 'easy',
              isPremium: false,
              answer: 'x = 9',
              steps: [
                { step: 1, explanation: 'Restamos 4 en ambos lados', expression: 'x/3 = 7 - 4', result: 'x/3 = 3' },
                { step: 2, explanation: 'Multiplicamos por 3 en ambos lados', expression: 'x = 3 × 3', result: 'x = 9' },
                { step: 3, explanation: 'Verificamos: 9/3 + 4 = 3 + 4 = 7 ✓', expression: '9/3 + 4', result: '7 ✓' },
              ],
              hints: ['Primero aísla x/3', 'Luego multiplica por 3 para eliminar el denominador'],
            },
            {
              title: 'Ecuación con paréntesis',
              statement: 'Resuelve: 2(x - 3) + 4 = 12',
              difficulty: 'medium',
              isPremium: false,
              answer: 'x = 7',
              steps: [
                { step: 1, explanation: 'Aplicamos distributiva', expression: '2x - 6 + 4 = 12', result: '2x - 2 = 12' },
                { step: 2, explanation: 'Sumamos 2 en ambos lados', expression: '2x = 12 + 2', result: '2x = 14' },
                { step: 3, explanation: 'Dividimos entre 2', expression: 'x = 14 ÷ 2', result: 'x = 7' },
                { step: 4, explanation: 'Verificamos: 2(7-3)+4 = 2(4)+4 = 8+4 = 12 ✓', expression: '2(7-3)+4', result: '12 ✓' },
              ],
              hints: ['Primero aplica la propiedad distributiva para eliminar el paréntesis'],
            },
          ],
        },
        {
          slug: 'sistemas-2x2',
          title: 'Sistemas de 2×2',
          order: 2,
          isPremium: false,
          content: `## Sistemas de ecuaciones 2×2
Un sistema de dos ecuaciones con dos incógnitas se puede resolver por:

### Método de sustitución
1. Despejar una variable en una ecuación
2. Sustituir en la otra ecuación
3. Resolver la ecuación resultante

### Método de eliminación (suma/resta)
1. Multiplicar ecuaciones para igualar coeficientes
2. Sumar o restar para eliminar una variable
3. Resolver y sustituir de vuelta`,
          problems: [
            {
              title: 'Sistema por sustitución',
              statement: 'Resuelve el sistema:\nx + y = 7\n2x - y = 2',
              difficulty: 'medium',
              isPremium: false,
              answer: 'x = 3, y = 4',
              steps: [
                { step: 1, explanation: 'De la primera ecuación despejamos y', expression: 'y = 7 - x', result: 'y = 7 - x' },
                { step: 2, explanation: 'Sustituimos en la segunda ecuación', expression: '2x - (7 - x) = 2', result: '2x - 7 + x = 2' },
                { step: 3, explanation: 'Simplificamos y resolvemos', expression: '3x = 9', result: 'x = 3' },
                { step: 4, explanation: 'Sustituimos x=3 para encontrar y', expression: 'y = 7 - 3', result: 'y = 4' },
                { step: 5, explanation: 'Verificamos en ambas ecuaciones', expression: '3+4=7 ✓  y  2(3)-4=2 ✓', result: 'Correcto ✓' },
              ],
              hints: ['Despeja una variable en la ecuación más sencilla', 'Luego sustituye en la otra'],
            },
          ],
        },
        {
          slug: 'factorizacion',
          title: 'Factorización',
          order: 3,
          isPremium: false,
          content: `## Factorización
Factorizar es escribir una expresión como **producto de factores**.

### Técnicas principales
1. **Factor común**: sacar el factor que comparten todos los términos
2. **Diferencia de cuadrados**: a² - b² = (a+b)(a-b)
3. **Trinomio cuadrado perfecto**: a² ± 2ab + b² = (a ± b)²
4. **Trinomio de la forma x² + bx + c**: buscar dos números que sumen b y multipliquen c`,
          problems: [
            {
              title: 'Factor común',
              statement: 'Factoriza: 6x² + 9x',
              difficulty: 'easy',
              isPremium: false,
              answer: '3x(2x + 3)',
              steps: [
                { step: 1, explanation: 'Encontramos el MCD de los coeficientes: MCD(6,9) = 3', expression: 'MCD(6,9) = 3', result: 'Factor numérico: 3' },
                { step: 2, explanation: 'Encontramos la menor potencia de x: x¹', expression: 'min(x², x¹) = x', result: 'Factor literal: x' },
                { step: 3, explanation: 'Factor común = 3x', expression: '6x² + 9x = 3x(    )', result: '3x(   )' },
                { step: 4, explanation: 'Dividimos cada término entre 3x', expression: '6x²/3x = 2x  y  9x/3x = 3', result: '3x(2x + 3)' },
              ],
              hints: ['Busca el número que divide a 6 y a 9', 'También fíjate en la x que tienen en común'],
            },
            {
              title: 'Diferencia de cuadrados',
              statement: 'Factoriza: x² - 25',
              difficulty: 'medium',
              isPremium: false,
              answer: '(x + 5)(x - 5)',
              steps: [
                { step: 1, explanation: 'Identificamos la forma a² - b²', expression: 'x² - 25 = x² - 5²', result: 'a = x, b = 5' },
                { step: 2, explanation: 'Aplicamos la fórmula (a+b)(a-b)', expression: '(x + 5)(x - 5)', result: '(x + 5)(x - 5)' },
                { step: 3, explanation: 'Verificamos expandiendo: x²-5x+5x-25 = x²-25 ✓', expression: '(x+5)(x-5)', result: 'x² - 25 ✓' },
              ],
              hints: ['Nota que 25 = 5² y que x² es un cuadrado perfecto', 'Usa la identidad a² - b² = (a+b)(a-b)'],
            },
          ],
        },
      ],
    },
    {
      slug: 'aritmetica-porcentajes',
      title: 'Aritmética y Porcentajes',
      description: 'Fracciones, decimales, porcentajes, razones y proporciones aplicados a problemas reales.',
      area: 'Matemáticas',
      level: 'Básico',
      isPremium: false,
      order: 2,
      emoji: '💯',
      units: [
        {
          slug: 'fracciones-decimales',
          title: 'Fracciones y decimales',
          order: 1,
          isPremium: false,
          content: `## Fracciones y decimales
Una fracción **a/b** representa a partes de un todo dividido en b partes iguales.

### Conversión fracción → decimal
Divide numerador ÷ denominador. Ejemplo: 3/4 = 3 ÷ 4 = 0.75

### Conversión decimal → fracción
Escribe el decimal como fracción con potencia de 10. Ejemplo: 0.6 = 6/10 = 3/5`,
          problems: [
            {
              title: 'Suma de fracciones',
              statement: 'Calcula: 2/3 + 1/4',
              difficulty: 'easy',
              isPremium: false,
              answer: '11/12',
              steps: [
                { step: 1, explanation: 'Encontramos el MCM de 3 y 4: MCM(3,4) = 12', expression: 'MCM(3,4) = 12', result: 'Denominador común: 12' },
                { step: 2, explanation: 'Convertimos cada fracción', expression: '2/3 = 8/12  y  1/4 = 3/12', result: '8/12 + 3/12' },
                { step: 3, explanation: 'Sumamos numeradores', expression: '(8 + 3)/12', result: '11/12' },
              ],
              hints: ['Necesitas un denominador común', 'El MCM de 3 y 4 es 12'],
            },
          ],
        },
        {
          slug: 'porcentajes',
          title: 'Porcentajes',
          order: 2,
          isPremium: false,
          content: `## Porcentajes
"Por ciento" significa "de cada 100".

### Fórmulas clave
- **% de un número**: (porcentaje × número) ÷ 100
- **Qué % es A de B**: (A ÷ B) × 100
- **Valor original**: (valor ÷ porcentaje) × 100

### Descuentos e IVA
- Descuento: Precio × (1 - descuento%)
- Con IVA (16%): Precio × 1.16`,
          problems: [
            {
              title: 'Cálculo de porcentaje',
              statement: '¿Cuánto es el 35% de 240?',
              difficulty: 'easy',
              isPremium: false,
              answer: '84',
              steps: [
                { step: 1, explanation: 'Convertimos el porcentaje a decimal', expression: '35% = 35/100 = 0.35', result: '0.35' },
                { step: 2, explanation: 'Multiplicamos por el número', expression: '0.35 × 240', result: '84' },
              ],
              hints: ['Convierte el porcentaje a decimal diviendo entre 100', 'Luego multiplica'],
            },
            {
              title: 'Descuento',
              statement: 'Un artículo cuesta $350 y tiene 20% de descuento. ¿Cuánto pagas?',
              difficulty: 'medium',
              isPremium: false,
              answer: '$280',
              steps: [
                { step: 1, explanation: 'Calculamos el descuento en pesos', expression: '20% × $350 = 0.20 × 350', result: '$70 de descuento' },
                { step: 2, explanation: 'Restamos el descuento', expression: '$350 - $70', result: '$280' },
                { step: 3, explanation: 'Método alternativo: 350 × (1 - 0.20) = 350 × 0.80 = 280', expression: '350 × 0.80', result: '$280 ✓' },
              ],
              hints: ['El descuento es 20% del precio original', 'También puedes multiplicar por 0.80 directamente'],
            },
          ],
        },
      ],
    },
    {
      slug: 'geometria-basica',
      title: 'Geometría Básica',
      description: 'Áreas, perímetros, volúmenes y el teorema de Pitágoras con problemas paso a paso.',
      area: 'Matemáticas',
      level: 'Básico',
      isPremium: false,
      order: 3,
      emoji: '📐',
      units: [
        {
          slug: 'areas-perimetros',
          title: 'Áreas y perímetros',
          order: 1,
          isPremium: false,
          content: `## Áreas y perímetros

| Figura | Área | Perímetro |
|--------|------|-----------|
| Cuadrado (lado a) | a² | 4a |
| Rectángulo (b×h) | b×h | 2(b+h) |
| Triángulo (b,h) | (b×h)/2 | suma de lados |
| Círculo (r) | πr² | 2πr |`,
          problems: [
            {
              title: 'Área de triángulo',
              statement: 'Un triángulo tiene base 8 cm y altura 5 cm. ¿Cuál es su área?',
              difficulty: 'easy',
              isPremium: false,
              answer: '20 cm²',
              steps: [
                { step: 1, explanation: 'Aplicamos la fórmula del área del triángulo', expression: 'A = (base × altura) / 2', result: 'A = (8 × 5) / 2' },
                { step: 2, explanation: 'Calculamos', expression: 'A = 40 / 2', result: 'A = 20 cm²' },
              ],
              hints: ['El área del triángulo es la mitad del producto base × altura'],
            },
          ],
        },
        {
          slug: 'pitagoras',
          title: 'Teorema de Pitágoras',
          order: 2,
          isPremium: false,
          content: `## Teorema de Pitágoras
En un triángulo rectángulo: **a² + b² = c²**
donde c es la hipotenusa (el lado más largo, opuesto al ángulo recto).

### Usos
- Encontrar la hipotenusa: c = √(a² + b²)
- Encontrar un cateto: a = √(c² - b²)`,
          problems: [
            {
              title: 'Hipotenusa',
              statement: 'Un triángulo rectángulo tiene catetos de 3 y 4 cm. ¿Cuánto mide la hipotenusa?',
              difficulty: 'easy',
              isPremium: false,
              answer: '5 cm',
              steps: [
                { step: 1, explanation: 'Aplicamos c² = a² + b²', expression: 'c² = 3² + 4²', result: 'c² = 9 + 16' },
                { step: 2, explanation: 'Sumamos', expression: 'c² = 25', result: 'c² = 25' },
                { step: 3, explanation: 'Sacamos raíz cuadrada', expression: 'c = √25', result: 'c = 5 cm' },
              ],
              hints: ['Este es el trío pitagórico clásico 3-4-5', 'c² = a² + b²'],
            },
          ],
        },
      ],
    },
    {
      slug: 'mecanica-clasica',
      title: 'Mecánica Clásica',
      description: 'Cinemática, Leyes de Newton, trabajo y energía con diagramas y ejercicios detallados.',
      area: 'Física',
      level: 'Intermedio',
      isPremium: true,
      order: 4,
      emoji: '⚡',
      units: [
        {
          slug: 'cinematica',
          title: 'Cinemática',
          order: 1,
          isPremium: true,
          content: `## Cinemática - Movimiento sin fuerzas

### Magnitudes fundamentales
- **Posición** (x): dónde está el objeto
- **Velocidad** (v): qué tan rápido se mueve
- **Aceleración** (a): qué tan rápido cambia su velocidad

### Ecuaciones MRUA (Movimiento Rectilíneo Uniformemente Acelerado)
| Ecuación | Cuándo usarla |
|----------|---------------|
| v = v₀ + at | Para encontrar velocidad final |
| x = v₀t + ½at² | Para encontrar posición |
| v² = v₀² + 2ax | Cuando no hay tiempo |`,
          problems: [
            {
              title: 'Velocidad final',
              statement: 'Un auto parte del reposo y acelera a 3 m/s² durante 8 segundos. ¿Cuál es su velocidad final?',
              difficulty: 'medium',
              isPremium: true,
              answer: '24 m/s',
              steps: [
                { step: 1, explanation: 'Identificamos datos: v₀=0, a=3 m/s², t=8s', expression: 'v₀ = 0  a = 3 m/s²  t = 8 s', result: 'Datos identificados' },
                { step: 2, explanation: 'Seleccionamos ecuación: v = v₀ + at', expression: 'v = 0 + (3)(8)', result: 'v = 24 m/s' },
              ],
              hints: ['"Parte del reposo" significa v₀ = 0', 'Usa v = v₀ + at'],
            },
          ],
        },
        {
          slug: 'leyes-de-newton',
          title: 'Leyes de Newton',
          order: 2,
          isPremium: true,
          content: `## Las tres leyes de Newton

### Primera ley (Inercia)
Un objeto en reposo permanece en reposo, y uno en movimiento sigue en movimiento, **a menos que una fuerza neta actúe sobre él**.

### Segunda ley (F = ma)
La aceleración de un objeto es directamente proporcional a la fuerza neta e inversamente proporcional a su masa.
**F = m × a**

### Tercera ley (Acción-Reacción)
Por cada acción hay una reacción igual y opuesta.`,
          problems: [
            {
              title: 'Fuerza neta',
              statement: 'Una caja de 10 kg recibe una fuerza de 50 N. Si la fricción es de 20 N, ¿cuál es la aceleración?',
              difficulty: 'medium',
              isPremium: true,
              answer: '3 m/s²',
              steps: [
                { step: 1, explanation: 'Calculamos la fuerza neta', expression: 'F_neta = 50 N - 20 N', result: 'F_neta = 30 N' },
                { step: 2, explanation: 'Aplicamos la Segunda Ley: F = ma → a = F/m', expression: 'a = 30 N / 10 kg', result: 'a = 3 m/s²' },
              ],
              hints: ['Primero suma todas las fuerzas (considera signos)', 'Luego despeja a de F = ma'],
            },
          ],
        },
      ],
    },
    {
      slug: 'calculo-diferencial',
      title: 'Cálculo Diferencial',
      description: 'Límites, derivadas y sus aplicaciones con teoría clara y muchos ejemplos.',
      area: 'Matemáticas',
      level: 'Avanzado',
      isPremium: true,
      order: 5,
      emoji: '∫',
      units: [
        {
          slug: 'limites',
          title: 'Límites',
          order: 1,
          isPremium: true,
          content: `## Límites
El límite de f(x) cuando x se acerca a c es el valor al que se aproxima f(x).

### Propiedades
- lim[f(x) + g(x)] = lim f(x) + lim g(x)
- lim[f(x) × g(x)] = lim f(x) × lim g(x)
- lim c = c (constante)

### Límites importantes
- lim(x→0) sen(x)/x = 1
- lim(x→0) (eˣ - 1)/x = 1`,
          problems: [
            {
              title: 'Límite algebraico',
              statement: 'Evalúa: lim(x→3) (x² - 9)/(x - 3)',
              difficulty: 'medium',
              isPremium: true,
              answer: '6',
              steps: [
                { step: 1, explanation: 'Sustitución directa da 0/0 (indeterminado)', expression: '(3²-9)/(3-3) = 0/0', result: 'Indeterminado → factorizar' },
                { step: 2, explanation: 'Factorizamos el numerador: diferencia de cuadrados', expression: '(x²-9) = (x+3)(x-3)', result: 'lim (x+3)(x-3)/(x-3)' },
                { step: 3, explanation: 'Cancelamos el factor (x-3)', expression: 'lim(x→3) (x+3)', result: 'lim(x→3) (x+3)' },
                { step: 4, explanation: 'Sustituimos x = 3', expression: '3 + 3', result: '6' },
              ],
              hints: ['Intenta sustitución directa primero', 'Si da 0/0, factoriza el numerador'],
            },
          ],
        },
        {
          slug: 'derivadas',
          title: 'Derivadas',
          order: 2,
          isPremium: true,
          content: `## Derivadas
La derivada f'(x) representa la tasa de cambio instantánea de f en x.

### Reglas de derivación
| Regla | Fórmula |
|-------|---------|
| Potencia | d/dx[xⁿ] = nxⁿ⁻¹ |
| Constante | d/dx[c] = 0 |
| Suma/resta | [f±g]' = f'±g' |
| Producto | [fg]' = f'g + fg' |
| Cociente | [f/g]' = (f'g - fg')/g² |
| Cadena | [f(g(x))]' = f'(g(x))·g'(x) |`,
          problems: [
            {
              title: 'Regla de la potencia',
              statement: 'Deriva: f(x) = 3x⁴ - 2x² + 5x - 1',
              difficulty: 'medium',
              isPremium: true,
              answer: "f'(x) = 12x³ - 4x + 5",
              steps: [
                { step: 1, explanation: 'Derivamos término a término', expression: 'd/dx[3x⁴] = 3·4x³ = 12x³', result: '12x³' },
                { step: 2, explanation: 'Segundo término', expression: 'd/dx[-2x²] = -2·2x = -4x', result: '-4x' },
                { step: 3, explanation: 'Tercer término', expression: 'd/dx[5x] = 5', result: '5' },
                { step: 4, explanation: 'La derivada de una constante es 0', expression: 'd/dx[-1] = 0', result: '0' },
                { step: 5, explanation: 'Juntamos todos los términos', expression: "f'(x) = 12x³ - 4x + 5", result: "f'(x) = 12x³ - 4x + 5" },
              ],
              hints: ['Para xⁿ, baja el exponente como coeficiente y resta 1 al exponente', 'Las constantes se derivan a 0'],
            },
          ],
        },
      ],
    },
    {
      slug: 'desarrollo-web',
      title: 'Desarrollo Web',
      description: 'HTML semántico, CSS moderno, JavaScript y DOM para construir interfaces funcionales.',
      area: 'Programación',
      level: 'Básico',
      isPremium: false,
      order: 6,
      emoji: '💻',
      units: [
        {
          slug: 'html-semantico',
          title: 'HTML Semántico',
          order: 1,
          isPremium: false,
          content: `## HTML Semántico
HTML (HyperText Markup Language) estructura el contenido de la web.

### Etiquetas semánticas clave
\`\`\`html
<header>  – Encabezado de página/sección
<nav>     – Navegación
<main>    – Contenido principal
<section> – Sección temática
<article> – Contenido independiente
<footer>  – Pie de página
\`\`\`

### Ventajas del HTML semántico
- Mejor SEO
- Mayor accesibilidad
- Código más legible`,
          problems: [
            {
              title: 'Estructura básica',
              statement: '¿Qué etiqueta HTML se usa para el contenido principal de una página?',
              difficulty: 'easy',
              isPremium: false,
              answer: '<main>',
              steps: [
                { step: 1, explanation: 'El contenido principal de la página se envuelve en la etiqueta <main>', expression: '<main>\n  <!-- contenido principal -->\n</main>', result: '<main>' },
                { step: 2, explanation: 'Solo debe haber un <main> por página para buena semántica', expression: 'Una sola etiqueta <main>', result: 'Correcto' },
              ],
              hints: ['Piensa en la etiqueta que indica el "cuerpo" del contenido, no del HTML'],
            },
          ],
        },
      ],
    },
  ]

  for (const courseData of courses) {
    const { units, ...courseFields } = courseData

    const course = await prisma.course.upsert({
      where: { slug: courseFields.slug },
      update: courseFields,
      create: courseFields,
    })

    for (const unitData of units) {
      const { problems, ...unitFields } = unitData

      const unit = await prisma.courseUnit.upsert({
        where: { courseId_slug: { courseId: course.id, slug: unitFields.slug } },
        update: { ...unitFields, courseId: course.id },
        create: { ...unitFields, courseId: course.id },
      })

      for (const problem of problems) {
        await prisma.problem.upsert({
          where: { unitId_title: { unitId: unit.id, title: problem.title } },
          update: { ...problem, unitId: unit.id },
          create: { ...problem, unitId: unit.id },
        })
      }
    }
  }

  console.log('Seed completado: cursos, unidades y problemas insertados.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
