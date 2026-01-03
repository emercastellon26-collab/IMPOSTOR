(() => {
  (() => {
  const $ = (sel) => document.querySelector(sel);

  const state = {
    players: [],
    roles: {},
    roundsTotal: CONFIG.defaults.rounds,
    impostorsCount: CONFIG.defaults.impostors,
    category: null,
    word: null,
    round: 1,
    _votes: {}
  };

  let totalPlayers = 0;
  let currentPlayerIndex = 0;

  // Navegación de pantallas
  function goScreen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    $(id).classList.add('active');
  }

  // Inicializa categorías
  function initCategories(){
    const sel = $('#category-select');
    sel.innerHTML = '';
    Object.keys(CONFIG.categories).forEach(cat=>{
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat;
      sel.appendChild(opt);
    });
    state.category = sel.value;
  }

  // Ciclo de ingreso de nombres
  function startNameCycle(){
    currentPlayerIndex = 0;
    state.players = [];
    showNextPlayerInput();
  }

  function showNextPlayerInput(){
    const area = $('#player-name-area');
    const actions = $('#player-name-actions');
    area.innerHTML = `
      <label>Jugador ${currentPlayerIndex + 1}</label>
      <input type="text" id="player-name-input" placeholder="Nombre del jugador ${currentPlayerIndex + 1}" required/>
    `;
    actions.innerHTML = '';
    const btn = document.createElement('button');
    btn.textContent = currentPlayerIndex + 1 === totalPlayers ? 'Confirmar nombres' : 'Siguiente';
    btn.onclick = ()=>{
      const raw = $('#player-name-input').value.trim();
      if(!raw){ alert('Escribe un nombre válido'); return; }
      const exists = state.players.some(p => p.toLowerCase() === raw.toLowerCase());
      if(exists){ alert('Ese nombre ya fue ingresado. Escribe uno diferente.'); return; }
      state.players.push(raw);
      currentPlayerIndex++;
      if(currentPlayerIndex < totalPlayers){
        showNextPlayerInput();
      } else {
        goScreen('#screen-lobby');
      }
    };
    actions.appendChild(btn);
  }

  // Asignación de roles (El Colado / Ciudadano)
  function assignRoles(){
    const shuffled = [...state.players].sort(()=>Math.random()-0.5);
    const roles = {};
    shuffled.slice(0,state.impostorsCount).forEach(n=>roles[n]='El Colado');
    state.players.forEach(n=>{
      if(!roles[n]) roles[n]= SecretWord;
    });
    state.roles = roles;
  }

  // Selección de palabra secreta (solo interna, no se muestra)
  function pickSecretWord(){
    const list = CONFIG.categories[state.category] || [];
    if(list.length === 0){
      state.word = null;
      return;
    }
    state.word = list[Math.floor(Math.random() * list.length)];
  }

  // Mostrar roles sin revelar palabra a ciudadanos
  function showRolesWithButton(){
    const display = $('#role-display');
    const timerBox = $('#role-timer');
    const btnShow = $('#btn-show-role');
    const btnContinue = $('#btn-continue-to-hints');
    let index = 0;

    function updatePlayerPrompt(){
      if(index < state.players.length){
        const name = state.players[index];
        display.innerHTML = `<p><strong>${name}</strong> está listo para ver su rol.</p>`;
        timerBox.textContent = '';
        btnShow.style.display = 'inline-block';
        btnShow.disabled = false;
      } else {
        display.innerHTML = '<p>Todos los roles han sido revelados.</p>';
        timerBox.textContent = '';
        btnShow.style.display = 'none';
        btnContinue.disabled = false;
      }
    }

    btnShow.onclick = ()=>{
      const name = state.players[index];
      const role = state.roles[name];
      const text = role === 'El Colado' ? 'Eres EL COLADO' : 'Eres CIUDADANO';
      display.innerHTML = `<p><strong>${name}</strong> → ${text}</p>`;
      btnShow.disabled = true;
      btnShow.style.display = 'none';

      let timeLeft = 3;
      timerBox.textContent = `Visible: ${timeLeft}s`;
      const interval = setInterval(()=>{
        timeLeft--;
        if(timeLeft > 0){
          timerBox.textContent = `Visible: ${timeLeft}s`;
        } else {
          clearInterval(interval);
          timerBox.textContent = '';
          index++;
          updatePlayerPrompt();
        }
      }, 1000);
    };

    btnContinue.disabled = true;
    updatePlayerPrompt();
  }

  // Pantalla intermedia: 10 segundos por jugador para dar su pista
  function startSayWordPhase(){
    goScreen('#screen-say-word');
    let index = 0;

    function showNextPlayer(){
      if(index < state.players.length){
        const name = state.players[index];
        $('#say-word-display').innerHTML = `<p>Es turno de <strong>${name}</strong> para dar su pista.</p>`;
        let timeLeft = 10;
        $('#say-word-timer').textContent = `Tiempo restante: ${timeLeft}s`;

        const interval = setInterval(()=>{
          timeLeft--;
          if(timeLeft > 0){
            $('#say-word-timer').textContent = `Tiempo restante: ${timeLeft}s`;
          } else {
            clearInterval(interval);
            $('#say-word-timer').textContent = 'Tiempo terminado';
          }
        },1000);

        $('#btn-next-say-word').onclick = ()=>{
          clearInterval(interval);
          index++;
          showNextPlayer();
        };

      } else {
        setupVotingSequential();
        goScreen('#screen-vote');
      }
    }

    showNextPlayer();
  }

  // Votación secuencial con Pausar/Reanudar
  function setupVotingSequential(){
    const area = $('#vote-area');
    const timerBox = $('#vote-timer');
    const btnResolve = $('#btn-resolve-vote');
    state._votes = {};
    state.players.forEach(p => state._votes[p] = 0);

    let voterIndex = 0;
    let countdownInterval = null;
    let paused = false;
    let timeLeft = CONFIG.defaults.voteSeconds || 30;

    function showNextVoter(){
      if(voterIndex < state.players.length){
        const voter = state.players[voterIndex];
        area.innerHTML = `<h3>Turno de <strong>${voter}</strong></h3>`;
        const list = document.createElement('div');
        list.className = 'form-row';

        state.players.forEach(target=>{
          if(target !== voter){
            const btn = document.createElement('button');
            btn.textContent = `Votar a ${target}`;
            btn.onclick = ()=>{
              clearInterval(countdownInterval);
              timerBox.textContent = '';
              state._votes[target] += 1;
              voterIndex++;
              showNextVoter();
            };
            list.appendChild(btn);
          }
        });

        area.appendChild(list);

        const btnPause = document.createElement('button');
        btnPause.textContent = 'Pausar';
        btnPause.style.marginTop = '10px';
        area.appendChild(btnPause);

        timeLeft = CONFIG.defaults.voteSeconds || 30;
        timerBox.textContent = `Tiempo restante: ${timeLeft}s`;

        countdownInterval = setInterval(()=>{
          if(!paused){
            timeLeft--;
            if(timeLeft > 0){
              timerBox.textContent = `Tiempo restante: ${timeLeft}s`;
            } else {
              clearInterval(countdownInterval);
              timerBox.textContent = '';
              voterIndex++;
              showNextVoter();
            }
          }
        },1000);

        btnPause.onclick = ()=>{
          paused = !paused;
          btnPause.textContent = paused ? 'Reanudar' : 'Pausar';
        };

      } else {
        area.innerHTML = '<p>Todos los jugadores han votado.</p>';
        timerBox.textContent = '';
        btnResolve.disabled = false;
      }
    }

    btnResolve.disabled = true;
    showNextVoter();
  }

  // Resolver votos y mostrar resultado
  function resolveVotes(){
    const summary = $('#result-summary');
    const entries = Object.entries(state._votes || {});
    if(entries.length === 0){
      summary.textContent = 'No hay votos registrados.';
      return;
    }
    let max = -1, winner = null;
    entries.forEach(([name, count])=>{
      if(count > max){ max = count; winner = name; }
    });
    const role = state.roles[winner];
    summary.innerHTML = `
      <p>Jugador más votado: <strong>${winner}</strong> (${max} votos)</p>
      <p>Su rol era: <strong>${role}</strong></p>
    `;
  }

  // Siguiente ronda
  function nextRound(){
    state.round += 1;
    assignRoles();
    pickSecretWord();
    goScreen('#screen-roles');
    const btnCont = $('#btn-continue-to-hints');
    if(btnCont) btnCont.disabled = true;
    const btnShow = $('#btn-show-role');
    if(btnShow) btnShow.style.display = 'inline-block';
    const disp = $('#role-display');
    const tim = $('#role-timer');
    if(disp) disp.innerHTML = '';
    if(tim) tim.textContent = '';
    showRolesWithButton();
  }

  // Reiniciar
  function restartGame(){
    state.players = [];
    state.roles = {};
    state._votes = {};
    state.round = 1;
    state.word = null;
    totalPlayers = 0;
    currentPlayerIndex = 0;
    goScreen('#screen-player-count');
  }

  // Listeners
  document.addEventListener('DOMContentLoaded', ()=>{
    initCategories();

    // Fijar número de jugadores
    const btnSetPlayers = $('#btn-set-players');
    if(btnSetPlayers){
      btnSetPlayers.onclick = ()=>{
        totalPlayers = parseInt($('#player-count').value,10);
        if(isNaN(totalPlayers) || totalPlayers < 3){
          alert('Mínimo 3 jugadores'); return;
        }
        goScreen('#screen-player-names');
        startNameCycle();
      };
    }

    // Iniciar partida
    const btnStart = $('#btn-start');
    if(btnStart){
      btnStart.onclick = ()=>{
        const r = parseInt($('#rounds').value,10);
        const i = parseInt($('#impostors').value,10);
        const c = $('#category-select').value;

        if(!isNaN(r)) state.roundsTotal = r;
        if(!isNaN(i)) state.impostorsCount = i;
        state.category = c;

        if(state.impostorsCount >= state.players.length){
          alert('Debe haber menos Colados que jugadores.');
          return;
        }

        assignRoles();
        pickSecretWord();
        state.round = 1;

        goScreen('#screen-roles');
        const btnCont = $('#btn-continue-to-hints');
        if(btnCont) btnCont.disabled = true;
        showRolesWithButton();
      };
    }

    // Continuar a pantalla de pistas (10s por jugador)
    const btnContinueHints = $('#btn-continue-to-hints');
    if(btnContinueHints){
      btnContinueHints.onclick = ()=>{
        startSayWordPhase();
      };
    }

    // Ir a votación (en caso de que lo llames directo)
    const btnGoVote = $('#btn-go-vote');
    if(btnGoVote){
      btnGoVote.onclick = ()=>{
        startSayWordPhase();
      };
    }

    // Resolver votación
    const btnResolveVote = $('#btn-resolve-vote');
    if(btnResolveVote){
      btnResolveVote.onclick = ()=>{
        resolveVotes();
        goScreen('#screen-result');
      };
    }

    // Siguiente ronda / fin
    const btnNextRound = $('#btn-next-round');
    if(btnNextRound){
      btnNextRound.onclick = ()=>{
        if(state.round < state.roundsTotal){
          nextRound();
        } else {
          const stats = $('#final-stats');
          if(stats){
            stats.innerHTML = `
              <p>Partida finalizada tras ${state.roundsTotal} rondas.</p>
              <p>Jugadores: ${state.players.join(', ')}</p>
            `;
          }
          goScreen('#screen-end');
        }
      };
    }

    // Terminar partida
    const btnEndGame = $('#btn-end-game');
    if(btnEndGame){
      btnEndGame.onclick = ()=>{
        const stats = $('#final-stats');
        if(stats){
          stats.innerHTML = `
            <p>Partida finalizada por el usuario.</p>
            <p>Rondas jugadas: ${state.round}</p>
          `;
        }
        goScreen('#screen-end');
      };
    }

    // Reiniciar
    const btnRestart = $('#btn-restart');
    if(btnRestart){
      btnRestart.onclick = restartGame;
    }
  });
})();
function mostrarRol(jugador) {
  const rol = jugador.rol; // ej. "CIUDADANO", "IMPOSTOR", "MR.WHITE"
  const palabra = jugador.palabra; // solo visible para ciudadanos

  const roleDisplay = document.getElementById("role-display");
  roleDisplay.innerHTML = `
    <h3>${jugador.nombre} → Eres ${rol}</h3>
    ${rol === "CIUDADANO" ? `<p class="word">Palabra: ${palabra}</p>` : ""}
    <p class="subtitle">Visible: 2s</p>
  `;

  document.getElementById("screen-roles").classList.add("active");

  setTimeout(() => {
    document.getElementById("btn-continue-to-hints").style.display = "block";
  }, 2000);
}


}

