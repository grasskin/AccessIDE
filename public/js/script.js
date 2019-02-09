$('.run-program').click(function () {
    runit();
});

// Keyboard shortcuts
$(document).keydown(function (e) {
    // Click "ESC" to switch between command bar and input
    if (e.which == 27 && $('.form-control').is(':focus') == false) {
        $('.form-control').focus();
        startVoice();
    } else if (e.which == 27) {
        $('.ace_content').focus();
        endVoice();
    }
});

function downloadFile(name) {
    var file = new File([editor.getValue()], name + ".py", {
        type: "text/plain;charset=utf-8"
    });
    saveAs(file);
}

function openFile() {
    
}

function feedbackDisplay(feedback) {
    $("#feedbackBar").text(feedback);
    $("#feedbackBar").fadeIn(500).delay(feedback.length * 200).fadeOut(500);
}

function commandDisplay(command) {
    command = command.trim();
    command = command.toLowerCase();
    if (command.indexOf(".") >= 0) {
        command = command.substring(0, command.length - 1);
    }
    $("#scriptBox").val(command);
    $("#scriptBox")
        .css("color", "#2e9dc6")
        .delay(300)
        .queue(function (next) {
            $(this).css("color", "rgba(255, 255, 255, 0)");
            next();
        })
        .delay(1000)
        .queue(function (next) {
            $(this).val("");
            $(this).css("color", "white");
            next();
    })
    runCommand(command)
    editor.focus();
}

function commandEntered(e) {
    if (e.keyCode == 13) {
        $(".form-control").blur();
        if ($("#scriptBox").val() != undefined) {
            commandDisplay($("#scriptBox").val());
        }
        return false;
    }
}

function pythonSuccess() {
    $("#output").css("color", "white")
    $("#feedbackBar").css("color", "white")
    giveFeedback("Program ran successfully.")
}

function pythonError(error) {
    $("#output").css("color", "red")
    $("#feedbackBar").css("color", "red")
    giveFeedback(checkError(error))
}
