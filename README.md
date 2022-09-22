# Projeto parcial 2 - Trabalho de computação gráfica

Esse repositório contém o trabalho feito pelo grupo 8 da disciplina de processamento gráfico 2022-1 (para a parte de computação gráfica da disciplina, que é lecionada
pelo professor Mario Liziér).

Os integrantes do grupo são:
- [Bruno Correia Rocha](https://github.com/akabrunao) - RA: 770990
- [Maria Anita de Moura](https://github.com/A-nita) - RA: 790084
- [Felipe de Castro Duchen Auroux](https://github.com/FelipeDuch) - RA: 793243
- [Gregório Fornetti Azevedo](https://github.com/GregorioFornetti) - RA: 792181

## Jogo da cobrinha

O trabalho consistia em no mínimo renderizar 4 objetos (já que nosso grupo possui 4 integrantes) na tela e pelo menos animar um deles.

Para fazer isso, foi utilizado o JavaScript + WebGL + algumas pequenas bibliotecas disponibilizadas pelo professor em um dos exemplos (todos codigos
dessas bibliotecas estão na pasta libs)

Nosso projeto consiste em basicamente um jogo classico da cobrinha, só que utilizando objetos 3D, no caso, cubos. Basicamente, cada parte da cobra é um cubo
e pode ser considerado um objeto a parte. Além disso, também existem as maçãs como outros objetos que criamos e também oque chamamos de "corpos de teleporte", que
foram usados para fazer um efeito de "teleporte" caso chegasse saisse dos limites da grid/mapa do jogo. Para finalizar, cada parte de cobra, ao se movimentar,
aplica uma animação de rotação diferente, dependendo de qual lado ela está indo (cima, baixo, esquerda ou direita).

## Como jogar ?

O nosso projeto está no ar no github pages, que pode ser acessado pelo link [https://gregoriofornetti.github.io/trabalho-cg/](https://gregoriofornetti.github.io/trabalho-cg/)
