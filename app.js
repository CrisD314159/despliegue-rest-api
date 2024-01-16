const express = require('express')
const movies = require('./movies.json')
const cors = require('cors')
const crypto = require('node:crypto') // esto nos permite crear un id unico uuid

const { verifyMovie, verifyMoviePartial } = require('./schemas-zod/movies')

// express tiene una funcion que lo que hace es obtener los datos enviados que estén en json
// Esto nos sirve para evitar tener que manupular los chunks de envio y transformara json manualmente

const app = express()
app.use(express.json()) // por lo tanto en el post solo usamos request.body

app.use(cors({
  // podemos usar origin para filtrar entre urls permitidas
  origin: (origin, callback) => {
    const ACCEPTED = ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:1234']
    if (ACCEPTED.includes(origin)) return callback(null, true)

    if (!origin) return callback(null, true)

    return (callback(new Error('Not allowed by CORS')))
  }
})) // el problema de esto es que nos pone todo en global (*) por lo tanto permite todos los recursos

app.disable('x-powered-by') // pa que no diga que usamos express

const port = process.env.PORT ?? 1234

app.get('/', (req, res) => {
  res.json({ messaje: 'Hola, soy una app' })
})

/*
Rest API: Se fundamenta en la arquitectura de software REST (Representational State Transfer)
Esta tecnologia busca escalabilidad, simplicidad, visibilidad, facil de modificar, fiabilidad y portabilidad

Lo que representa y fundamenta una API Rest es lo siguiente:
- Resource: Cada recurso (que es cualquier cosa) se representa con una url

- Verbos(Métodos) HTTP: metodos get, post, put que funcionan como una especie de crud

- Separación de conceptos: El cliente y el servidor deben poder evolucionar de forma independiente

- Representaciones: EL cliente elige la representacion de un recurso (JSON, XML, HTML, etc.)

- Stateless: El cliente debe enviar toda la informacion necesaria para que se procese la solicitud.
Ninguna informacion de estado o de la solicitud se debe quedar en el backend

- Interfaz uniforme: una interfaz uniforme y ordenada

*/

// REST API
// Metodo con get para recuperar el recurso movies
app.get('/movies', (req, res) => {
  // Las queris son filtros adicoonales que podemos establecer como (filtrar por un genero, o una busqueda)
  // Estas se entraen del objeto query de la request (request.query)
  const { genre, search } = req.query // Podemos poner cualquier query que queramos, search, some, etc

  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(gen => gen.toLowerCase() === genre.toLowerCase())
      // el metodo retorna true si algun elemento del array coincide con el que queramos
    )
    return res.json(filteredMovies)
  }

  if (search) {
    const filteredMovie = movies.find(movie => movie.title.toLowerCase() === search.toLowerCase())
    return res.json(filteredMovie)
  }

  res.json(movies)
})

// Obtener una pelicula por su id
app.get('/movies/:id', (req, res) => {
  const { id } = req.params // Extraemos el valor id de la url del recurso
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).end('<h1>Movie not found</h1>')
})

// Crear una película
app.post('/movies', (req, res) => {
  const movie = verifyMovie(req.body)

  if (movie.error) { // si en vez de los datos hay un error, pues devolvemos un 400 con el error
    return res.status(422).json({ error: JSON.parse(movie.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...req.body

  }
  // Esto no seria rest ya que estamos guardando el estado de la peticion
  // Cuando usemso bbdd ya no será necesario esto
  movies.push(newMovie)
  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const { id } = req.params
  const result = verifyMoviePartial(req.body)
  const movieEdit = movies.findIndex(movie => movie.id === id)

  if (movieEdit < 0) return res.status(404).json({ message: 'Movie not found' })
  if (result.error) return res.status(400).json({ error: JSON.parse(result.error.message) })

  const updatedMovie = {
    ...movies[movieEdit],
    ...result.data // esto nos previene de modificar datos no deseados como el id
  }
  res.status(201).json(updatedMovie)
})

/**
 * Diferencia entre post, put y patch

 * post: Siempre que lo ejecutemos creara un nuevo recurso en una url como esta: /movies

 * put: actualizará completamente un recurso o lo creara si no existe en una url como este: /movies/:id

 * patch: Actualizará parcialmente un recurso  en una url como esta: /movies/:id
 */
app.listen(port, () => {
  console.log(`Conectado al servidor http://localhost/${port}`)
})

/**
 * El error de CORS es un error que se produce cuando se cruza informacion
 * solicitada de una url no autorizada que no es el origen
 *
 * Esto a falta de dos cabeceras que le explican al navegador que esas
 * urls estan autorizadas
 *
 * para eso existe una herramienta que se instala con npm: npm install cors
 */
