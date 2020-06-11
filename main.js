const { app, BrowserWindow } = require('electron')

function createWindow () {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 500,
        height: 340,
        frame: false,
        webPreferences: {
        nodeIntegration: true
        }
    })

    // load the DiceTray.html of the app.
    win.loadFile('DiceTray.html');
    win.setTitle("DiceTray");
    //win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();
})

var loaded = false;

function bodyLoaded(doc) {
    if (loaded) {
        return;
    }
    loaded = true;

    document.getElementById("modifier-slider").addEventListener('input', checkModifier, false);
    
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
  
app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// *********************** Frame Buttons ***********************

function closeProgram() {
    close();
}

function toggleMute(muteButton) {
    if (muteButton.classList.contains("glyphicon-volume-up")) {
        muteButton.classList.remove("glyphicon-volume-up");
        muteButton.classList.add("glyphicon-volume-off");
    }
    else {
        muteButton.classList.remove("glyphicon-volume-off");
        muteButton.classList.add("glyphicon-volume-up");
    }
}

function toggleHelp(helpButton) {
    var buttons = document.getElementsByClassName("glyph-button");
    
    if (helpButton.classList.contains("help-off")) {
        helpButton.classList.remove("help-off");
        helpButton.classList.add("help-on");
        for (buttonCount = 0; buttonCount < buttons.length; buttonCount++) {
            buttons[buttonCount].classList.add("show-text");
        }
    }
    else {
        helpButton.classList.remove("help-on");
        helpButton.classList.add("help-off");
        for (buttonCount = 0; buttonCount < buttons.length; buttonCount++) {
            if (buttons[buttonCount].classList.contains("show-text")) {
                buttons[buttonCount].classList.remove("show-text");
            }
        }
    }
}

// *********************** Altering Dice ***********************

function addDice(diceSize) {
    var newDie = document.createElement("div");
    newDie.classList.add("dice-button", "queued-dice", "d"+diceSize);
    // generate a random id
    newDie.setAttribute("id", "d" + diceSize + "-" + Math.floor((Math.random()*1000)+1));
    newDie.setAttribute("onClick", "removeDice(this.id)");

    var minusDiv = document.createElement("div");
    minusDiv.classList.add("glyphicon", "glyphicon-minus");

    var valueDiv = document.createElement("div");
    valueDiv.classList.add("dice-value");

    var rollQueue = document.getElementById("rollqueue");
    newDie.appendChild(valueDiv);
    // Removed the minus icon for now
    //newDie.appendChild(minusDiv);
    rollQueue.appendChild(newDie);
    checkModifier();
}

function removeDice(diceId) {
    var div = document.getElementById(diceId);
    div.parentNode.removeChild(div);
    checkModifier();
}

// *********************** Altering Modifier ***********************

function addOne() {
    document.getElementById("modifier-slider").value++;
    checkModifier();
}

function takeOne() {
    document.getElementById("modifier-slider").value--;
    checkModifier();
}

function checkModifier() {
    clearOldValues();

    var modifier = document.getElementById("modifier-slider").value;
    if (modifier != 0) {
        var queuedMod = document.createElement("div");
        queuedMod.classList.add("tray-number");
        queuedMod.setAttribute("id", "queued-modifier");

        queuedMod.innerHTML = modifier;
        if (modifier > 0)
            queuedMod.innerHTML = "+" + modifier;

        var minusDiv = document.createElement("div");
        minusDiv.classList.add("glyphicon", "glyphicon-minus");
        queuedMod.appendChild(minusDiv);

        document.getElementById("rollqueue").appendChild(queuedMod);
    }
}

// *********************** Refreshing Display ***********************

function clearOldValues() {
    var oldModifier = document.getElementById("queued-modifier");
    if (oldModifier != null)
        oldModifier.remove();

    var oldTotal = document.getElementById("total-display");
    if (oldTotal != null)
        oldTotal.remove();

    var queuedDice = document.getElementsByClassName("queued-dice");
    for (diceCounter = 0; diceCounter < queuedDice.length; diceCounter++) {
        var valueElement = queuedDice[diceCounter].childNodes[0];
        if (valueElement != null)
            valueElement.textContent = "";
    }
}

// *********************** Action Buttons ***********************

function clearQueue() {
    var queued = document.getElementById("rollqueue").childNodes;
    while (queued[0])
        queued[0].remove();
    document.getElementById("modifier-slider").value = 0;
    checkModifier();
}

function toggleHistory() {
    var historyTab = document.getElementById("historycontainer");

    if (historyTab.classList.contains("hide-history")) {
        historyTab.classList.add("show-history");
        historyTab.classList.remove("hide-history");
    }
    else {
        historyTab.classList.add("hide-history");
        historyTab.classList.remove("show-history");
    }
}

// *********************** Rolling ***********************

function rollDice() {
    checkModifier();
    playDiceSound();

    var queuedDice = document.getElementsByClassName("queued-dice");
    var total = setDiceResults(queuedDice);
    var modifierElement = document.getElementById("modifier-slider");
    var modifier = (Number)(modifierElement.value);
    total = total + modifier;

    var totalDisplay = makeTrayNumber("total-display", "= "+total);
    document.getElementById("rolltotal").appendChild(totalDisplay);

    var prevTotal = makeTrayNumber("prev-total", "= "+total);
    var prevModifier = makeTrayNumber("prev-modifier", modifier);

    logRoll(queuedDice, prevModifier, prevTotal);
}

function logRoll(dice, modifier, total) {
    clearOldLog(); // Ensures no more than x logs are kept
    var rollHistory = document.getElementById("rollhistory");

    var newLog = document.createElement("div");
    newLog.classList.add("previous-roll");

    for (diceCount = 0; diceCount < dice.length; diceCount++) {
        var loggedDie = document.createElement("div");
        loggedDie.classList.add("dice-button", "d" + getDiceSize(dice[diceCount]), "logged-dice");
        loggedDie.appendChild(dice[diceCount].childNodes[0].cloneNode(true));

        newLog.appendChild(loggedDie);
    }
    modifier.classList.add("logged-number");
    total.classList.add("logged-number");
    newLog.appendChild(modifier);
    newLog.appendChild(total);

    rollHistory.insertBefore(newLog, rollHistory.firstChild);
}

function clearOldLog() {
    var previousRolls = document.getElementsByClassName("previous-roll");
    if (previousRolls.length > 4) {
        previousRolls[4].remove();
    }
}

function makeTrayNumber(id, value) {
    var element = document.createElement("div");
    element.classList.add("tray-number");
    element.setAttribute("id", id);

    if (!isNaN(value) && (Number)(value) >= 0) { // If value is a negative number
            value = "+" + value;
    }

    element.innerHTML = value;
    return element;
}

function playDiceSound() {
    if (document.getElementById("mutebutton").classList.contains("glyphicon-volume-off"))
        return;

    switch (Math.floor(Math.random()*2) + 1) {
        case 1:
            var audio = new Audio('sounds/dice-roll-single.mp3');
            audio.play();
            break;
        case 2:
            var audio = new Audio('sounds/dice-roll-single2.wav');
            audio.play();
            break;
    }

    audio = new Audio('sounds/dice-roll-single.mp3');
    audio.play();
}

function setDiceResults(queuedDice) {
    var total = 0;
    for (diceCounter = 0; diceCounter < queuedDice.length; diceCounter++) {
        var diceSize = getDiceSize(queuedDice[diceCounter]);
        var result = Math.floor((Math.random() * diceSize) + 1);
        queuedDice[diceCounter].childNodes[0].textContent = result;

        if (result == diceSize) {
            queuedDice[diceCounter].childNodes[0].style.color = "rgb(39, 105, 0)";
        }
        else if (result == 1) {
            queuedDice[diceCounter].childNodes[0].style.color = "rgb(139, 0, 0)";
        }
        else {
            queuedDice[diceCounter].childNodes[0].style.color = "rgb(26, 26, 26)";
        }

        total += result;
    }
    return total;
}

function getDiceSize(die) {
    var classes = die.classList;
    for (classCounter = 0; classCounter < classes.length; classCounter++) {
        switch(classes[classCounter]) {
            case "d20": return 20; break;
            case "d12": return 12; break;
            case "d100": return 100; break;
            case "d10": return 10; break;
            case "d8": return 8; break;
            case "d6": return 6; break;
            case "d4": return 4; break;
            default: break;
        }
    }
}