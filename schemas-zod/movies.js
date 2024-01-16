const zod = require('zod') // zod nos permite validar de una forma facil los datos de la pelicula

const movieSchema = zod.object({
  title: zod.string({ required_error: 'Ingresa un string, no un número' }), // podemos añadir errores si queremos
  year: zod.number().int().min(1950).max(2025),
  director: zod.string({ required_error: 'Ingresa un string, no un número' }),
  duration: zod.number().positive(),
  poster: zod.string().url(),
  genre: zod.enum(['Action', 'Adventure', 'Drama', 'Sci-fi', 'Terror', 'Horror', 'Romance']).array(),
  rate: zod.number().min(0).max(10).optional()
})

function verifyMovie (object) {
  return movieSchema.safeParse(object)
  // esto devuelve un objeto que puede contener un error o los datos validados
}
function verifyMoviePartial (object) {
  return movieSchema.partial().safeParse(object)
  // lo que hace esto es validar los datos que vengan de manera opcional
  // es decir que todos los parametros en movieSchema se trataran como opcionales
}

module.exports = { verifyMovie, verifyMoviePartial }
