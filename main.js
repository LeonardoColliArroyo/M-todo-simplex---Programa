// Inicialmente, oculta la imagen de uso
document.getElementById('uso').style.display = 'none';

function cambiarImagen() {
    const infografia = document.getElementById('infografia');
    const uso = document.getElementById('uso');

    if (infografia.style.display === 'none') {
        infografia.style.display = 'block';
        uso.style.display = 'none';
    } else {
        infografia.style.display = 'none';
        uso.style.display = 'block';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    let seleccionOptim = '';  // Variable para guardar la selección de maximización o minimización

    const maximizacionBtn = document.getElementById("maximizacion");
    const minimizacionBtn = document.getElementById("minimizacion");
    const botonGenerar = document.querySelector(".boton-resolver");
    const agregarDatos = document.getElementById("AgregarDatos");

    // Función para seleccionar maximización o minimización
    window.seleccionarOpcion = function (opcion) {
        seleccionOptim = opcion; // Actualiza la opción seleccionada
        maximizacionBtn.classList.toggle('activo', opcion === 'maximizar');
        minimizacionBtn.classList.toggle('activo', opcion === 'minimizar');
    }

    // Función para generar los datos dinámicamente
    window.generarDatos = function () {
        const numVariables = document.getElementById("numero-variables").value;
        const numRestricciones = document.getElementById("numero-restricciones").value;

        // Limpiar datos existentes
        agregarDatos.innerHTML = ""; 
        agregarDatos.style.display = "block";

        // Crear campos para la función objetivo
        const funcionObjetivoDiv = document.createElement("div");
        funcionObjetivoDiv.innerHTML = `<label>Función Objetivo:</label>`;
        for (let j = 1; j <= numVariables; j++) {
            funcionObjetivoDiv.innerHTML += `<input type="number" id="x${j}" placeholder="x${j}" style="width: 50px;">`;
        }
        agregarDatos.appendChild(funcionObjetivoDiv);

        // Crear campos para las restricciones
        for (let i = 1; i <= numRestricciones; i++) {
            const restriccionDiv = document.createElement("div");
            restriccionDiv.innerHTML = `<label>Restricción ${i}:</label>`;
            for (let j = 1; j <= numVariables; j++) {
                restriccionDiv.innerHTML += `<input type="number" id="restriccion-${i}-x${j}" placeholder="x${j}" style="width: 50px;">`;
            }
            restriccionDiv.innerHTML += `<label style="margin: 0 5px;"> <= </label>`;
            restriccionDiv.innerHTML += `<input type="number" id="igualacion-${i}" placeholder="Igualación" style="width: 50px;">`;
            agregarDatos.appendChild(restriccionDiv);
        }

        // Agregar botón para regresar
        const botonRegresar = document.createElement("button");
        botonRegresar.textContent = "Regresar al formulario";
        botonRegresar.onclick = function() {
            agregarDatos.innerHTML = ""; // Limpiar datos existentes
            agregarDatos.style.display = "none"; // Ocultar sección
            document.getElementById("numero-variables").value = ''; // Limpiar input de número de variables
            document.getElementById("numero-restricciones").value = ''; // Limpiar input de número de restricciones
        };
        agregarDatos.appendChild(botonRegresar);

        // Agregar botón para resolver
        const botonResolverSimplex = document.createElement("button");
        botonResolverSimplex.textContent= "Resolver";
        botonResolverSimplex.id="resolverSimplex";
        botonResolverSimplex.onclick = function() {
            const funcionObjetivo = [];
            for (let j = 1; j <= numVariables; j++) {
                funcionObjetivo.push(parseFloat(document.getElementById(`x${j}`).value));
            }

            const restricciones = [];
            for (let i = 1; i <= numRestricciones; i++) {
                const restriccion = [];
                for (let j = 1; j <= numVariables; j++) {
                    restriccion.push(parseFloat(document.getElementById(`restriccion-${i}-x${j}`).value));
                }
                const igualacion = parseFloat(document.getElementById(`igualacion-${i}`).value);
                restricciones.push({ coeficientes: restriccion, igualacion: igualacion });
            }

            const resultado = simplexMethod(funcionObjetivo, restricciones, seleccionOptim);
            document.getElementById('resultados').innerHTML = resultado.resultadoTexto; // Mostrar resultados
            document.getElementById('resultados').style.display = "block"; // Mostrar sección de resultados

            // Mostrar tablas en una nueva pestaña
            abrirNuevaPestaña(funcionObjetivo, restricciones, resultado.tablaSimplex);
        };
        agregarDatos.appendChild(botonResolverSimplex);
    }
});
// Función que implementa el método Simplex
function simplexMethod(funcionObjetivo, restricciones, tipo) {
    const numVariables = funcionObjetivo.length;
    const numRestricciones = restricciones.length;

    // Crear la tabla Simplex
    const tablaSimplex = [];
    const variableBasica = [];
    const todasLasTablas = []; // Arreglo para guardar todas las tablas generadas

    // Inicializa la tabla con ceros
    for (let i = 0; i < numRestricciones + 1; i++) {
        tablaSimplex[i] = new Array(numVariables + numRestricciones + 1).fill(0);
    }

    // Llenar la tabla con las restricciones
    for (let i = 0; i < numRestricciones; i++) {
        for (let j = 0; j < numVariables; j++) {
            tablaSimplex[i][j] = restricciones[i].coeficientes[j];
        }
        tablaSimplex[i][numVariables + i] = 1; // Variable de holgura
        tablaSimplex[i][numVariables + numRestricciones] = restricciones[i].igualacion; // Término independiente
        variableBasica.push(`s${i + 1}`); // Variables de holgura
    }

    // Llenar la fila de la función objetivo
    for (let j = 0; j < numVariables; j++) {
        tablaSimplex[numRestricciones][j] = -funcionObjetivo[j]; // Negamos los coeficientes para maximización
    }

    // Procesar el método Simplex
    while (true) {
        // Guardar la tabla actual en el arreglo
        todasLasTablas.push(tablaSimplex.map(fila => [...fila])); // Guardar una copia de la tabla

        // Encontrar la variable entrante
        const filaObjetivo = tablaSimplex[numRestricciones];
        const variableEntrante = filaObjetivo.slice(0, numVariables + numRestricciones).indexOf(Math.min(...filaObjetivo.slice(0, numVariables + numRestricciones)));

        if (filaObjetivo[variableEntrante] >= 0) break; // Si no hay mejora, salimos

        // Encontrar la variable saliente
        let minRatio = Infinity;
        let filaSaliente = -1;

        for (let i = 0; i < numRestricciones; i++) {
            if (tablaSimplex[i][variableEntrante] > 0) {
                const ratio = tablaSimplex[i][numVariables + numRestricciones] / tablaSimplex[i][variableEntrante];
                if (ratio < minRatio) {
                    minRatio = ratio;
                    filaSaliente = i;
                }
            }
        }

        if (filaSaliente === -1) break; // Si no hay variable saliente, salimos

        // Actualizar la tabla Simplex
        const pivote = tablaSimplex[filaSaliente][variableEntrante];
        for (let j = 0; j < tablaSimplex[filaSaliente].length; j++) {
            tablaSimplex[filaSaliente][j] /= pivote; // Normaliza la fila saliente
        }

        for (let i = 0; i <= numRestricciones; i++) {
            if (i !== filaSaliente) {
                const factor = tablaSimplex[i][variableEntrante];
                for (let j = 0; j < tablaSimplex[i].length; j++) {
                    tablaSimplex[i][j] -= factor * tablaSimplex[filaSaliente][j]; // Elimina las otras filas
                }
            }
        }
    }

    // Obtener resultados
    const resultado = {};
    for (let i = 0; i < numVariables; i++) {
        resultado[`x${i + 1}`] = 0; // Inicializa todas las variables
    }

    for (let i = 0; i < numRestricciones; i++) {
        if (variableBasica[i] !== undefined) {
            resultado[variableBasica[i]] = tablaSimplex[i][numVariables + numRestricciones]; // Asigna valores
        }
    }

    // Obtener el valor objetivo
    const valorObjetivo = tablaSimplex[numRestricciones][numVariables + numRestricciones];

    // Formatear el resultado para mostrar
    let resultadoTexto = `<strong>Función objetivo:</strong> ${funcionObjetivo.join(", ")}<br>`;
    resultadoTexto += `<strong>Restricciones:</strong><br>`;
    restricciones.forEach((restriccion, index) => {
        resultadoTexto += `Restricción ${index + 1}: ${restriccion.coeficientes.join(", ")} <= ${restriccion.igualacion}<br>`;
    });

    resultadoTexto += `<strong>Valor óptimo:</strong> ${tipo === 'maximizar' ? valorObjetivo : -valorObjetivo}<br>`;
    for (const [variable, valor] of Object.entries(resultado)) {
        resultadoTexto += `${variable}: ${valor}<br>`;
    }

    // Mostrar todas las tablas generadas
    abrirNuevaPestaña(funcionObjetivo, restricciones, todasLasTablas); // Enviamos todas las tablas
    return { resultadoTexto, tablaSimplex }; // Devuelve tanto el texto como la tabla
}

// Función para abrir una nueva pestaña con las tablas generadas
function abrirNuevaPestaña(funcionObjetivo, restricciones, todasLasTablas) {
    const nuevaVentana = window.open("", "_blank");
    let contenido = "<html><head><title>Tablas del Método Simplex</title></head><body>";
    contenido += "<h1>Resultados del Método Simplex</h1>";
    contenido += `<strong>Función objetivo:</strong> ${funcionObjetivo.join(", ")}<br>`;
    contenido += `<strong>Restricciones:</strong><br>`;
    restricciones.forEach((restriccion, index) => {
        contenido += `Restricción ${index + 1}: ${restriccion.coeficientes.join(", ")} <= ${restriccion.igualacion}<br>`;
    });

    // Agregar la tabla Simplex para cada iteración
    for (let k = 0; k < todasLasTablas.length; k++) {
        contenido += `<h2>Tabla Simplex - Iteración ${k + 1}</h2>`;
        contenido += "<table border='1'><tr>";
        for (let i = 0; i < funcionObjetivo.length + restricciones.length + 1; i++) {
            contenido += "<th>" + (i < funcionObjetivo.length ? `x${i + 1}` : `s${i - funcionObjetivo.length + 1}`) + "</th>";
        }
        contenido += "</tr>";

        // Llenar la tabla con los valores de la iteración k
        for (let i = 0; i < restricciones.length + 1; i++) {
            contenido += "<tr>";
            for (let j = 0; j < funcionObjetivo.length + restricciones.length + 1; j++) {
                contenido += `<td>${todasLasTablas[k][i][j].toFixed(2)}</td>`; // Mostrar valores con dos decimales
            }
            contenido += "</tr>";
        }

        contenido += "</table>";
    }

    contenido += "</body></html>";
    nuevaVentana.document.write(contenido);
    nuevaVentana.document.close();
}
