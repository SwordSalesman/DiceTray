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

    // load the index.html of the app.
    win.loadFile('index.html');
    win.setTitle("DiceTray");
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow()
})

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

function toggleMute() {
    var muteButton = document.getElementById("mutebutton");
    
    if (muteButton.classList.contains("glyphicon-volume-up")) {
        muteButton.classList.remove("glyphicon-volume-up");
        muteButton.classList.add("glyphicon-volume-off");
    }
    else {
        muteButton.classList.remove("glyphicon-volume-off");
        muteButton.classList.add("glyphicon-volume-up");
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
    newDie.appendChild(minusDiv);
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
        queuedDice[diceCounter].childNodes[0].textContent = "";
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
    alert("Feature not yet implemented!");
}

// *********************** Rolling ***********************

function rollDice() {
    checkModifier();
    playDiceSound();

    var queuedDice = document.getElementsByClassName("queued-dice");
    var total = setDiceResults(queuedDice);
    var modifier = (Number)(document.getElementById("modifier-slider").value);
    total = total + modifier;

    var totalDisplay = document.createElement("div");
    totalDisplay.classList.add("tray-number");
    totalDisplay.setAttribute("id", "total-display");
    totalDisplay.innerHTML = "= " + total;
    document.getElementById("rolltotal").appendChild(totalDisplay);
}

function playDiceSound() {
    if (document.getElementById("mutebutton").classList.contains("glyphicon-volume-off"))
        return;
    
    var audio = new Audio('sounds/dice-roll-single.mp3');
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