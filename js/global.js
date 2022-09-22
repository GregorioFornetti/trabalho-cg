
// Arquivo de variáveis e constantes globais


const GRID_SIZE = 6  // Largura e altura da grid será GRID_SIZE * 2 + 1, para sempre ficar centralizado a primeira parte da cobra
const CUBE_SIZE = 2
const INITIAL_SPEED = 100

const BACK = 0
const FOWARD = 1
const LEFT = 2
const RIGHT = 3

const HEAD_COLOR = [0, 1, 0, 1]
const BODY_COLOR = [0, 0.9, 0, 1]
const APPLE_COLOR = [1, 0, 0, 1]


var gl;
var program;
var model;
var scene;

var score = 0
var currentMovement = RIGHT
var gameStoped = true

var movementFunctions = []
var animationStartTime
var animationSpeed = INITIAL_SPEED  // Graus por segundo
var movementList = []
var level = 1 // nivel de dificuldade
var ctnLevel = 5 // aumento de nivel 

var teleportAnimationMovementList = []  // Lista de movimentos dos cubos que sairam da grid