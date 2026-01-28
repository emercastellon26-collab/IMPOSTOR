// Configuración cultural para el juego
const CONFIG = {
  categories: {
    Jerga: [
      'Chavalo','Tuani','Chunche','Puchica','Guaro',
      'Fritanga','Chavala','Jodido','Qué tuani'
    ],
    Personajes: [
      'Rubén Darío','Augusto C. Sandino','Carlos Fonseca Amador',
      'Germán Pomares Ordóñez','Camilo Zapata','Luis Enrique Mejía López',
      'Arlen Siu Bermúdez','Gioconda Belli','Ernesto Cardenal Martínez','Alexis Argüello'
    ],
    Comida: [
      'Nacatamal','Vigorón','Indio Viejo','Quesillo','Sopa de mondongo',
      'Arroz a la valenciana','Tajadas con queso','Gallo pinto',
      'Rosquillas somoteñas','Cajeta de leche'
    ],
    Lugares: [
      'Catedral de León','Volcán Masaya','Laguna de Apoyo','Islas del Maíz',
      'Granada colonial','Puerto Salvador Allende','Volcán Mombacho',
      'Río San Juan','Corn Island','Reserva Indio Maíz'
    ],
    Tradiciones: [
      'La Purísima','El Güegüense','Toro Venado','Fiestas patronales','Carnaval de Bluefields'
    ]
  },

  defaults: {
    rounds: 2,
    impostors: 1,
    hintSeconds: 20,
    voteSeconds: 30,
    revealWordOnResult: false //  palabra oculta para más misterio
  },

  scoring: {
    coladoCaughtEarly: 2,
    coladoCaughtLate: 1,
    coladoEscapes: 2
  },

  rules: {
    description: "Todos menos El Colado ven la palabra. Cada uno da una pista registrada en orden. Se vota al Colado. La palabra nunca se revela, solo el resultado."
  }
};
