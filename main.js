(function() {
    GMEdit.register("git", {
        init: function() {
            commands = [
                {
                    name: "Commit",
                    bindKey: { mac: "Cmd+Shift+C", win: "Ctrl+Shift+C" },
                    exec: (editor) => { initCommit(); },
                }
            ];

            palCommands = [
                {
                    name: "Commit all changes",
                    exec: "Commit",
                    title: "Stage all changes and commit.",
                }
            ];

            for (let i = 0; i < commands.length; i++)
                AceCommands.add(commands[i]);

            for (let i = 0; i < palCommands.length; i++)
                AceCommands.addToPalette(palCommands[i]);
        },
    });
})();

const { exec } = require('child_process');
fileChanged = [];

function project_current_get() {
	const proj = $gmedit['gml.Project'].current;
	if (proj?.path === '') return undefined;
	return proj ?? undefined;
}

function commit(msg, push = false) {
    let project = project_current_get();
    let path = project.dir;

    let cmd = "git add . && git commit -m \"" + msg + "\"";
    if (push) cmd += " && git push";

    let form = document.getElementById("commit-form");
    let log = document.getElementById("commit-log");

    if(push) log.innerHTML = "Committing and pushing changes...";
    else     log.innerHTML = "Committing changes...";

    var list = document.getElementById("commit-list");
    if(fileChanged.length == 0) {
        
        if(push) {
            cmd = "git push";
            log.innerHTML = "Pushing changes...";
        } else {
            log.innerHTML = "No changes to commit.";
            setTimeout(() => { form.style.opacity = "0"; setTimeout(() => { form.remove(); }, 1000); }, 2500);
            return;
        }
    }

    form.style.width = "320px";
    form.style.height = "36px";
    form.style.top = "unset";
    form.style.bottom = "16px";
    form.style.borderRadius = "16px";

    exec(cmd, { cwd: path }, (error, stdout, stderr) => {
        setTimeout(() => { form.style.opacity = "0"; setTimeout(() => { form.remove(); }, 1000); }, 2500);

        if (error) {
            log.innerHTML = "Failed to commit changes. " + error.message;
            //alert("Failed to commit changes. " + error.message);
            return;
        }
        
        log.innerHTML = "Changes committed successfully.";
        //alert("Changes committed successfully.");
    });
}

function getChanged() {
    let project = project_current_get();
    let path = project.dir;
    let cmd = "git diff --name-only";

    var list = document.getElementById("commit-list");

    exec(cmd, { cwd: path }, (error, stdout, stderr) => {
        if (error) {
            console.log("Failed to get changed files. " + error.message);
            return;
        }

        console.log(stdout);
        fileChanged = stdout.split("\n");
        fileChanged.pop();

        if(fileChanged.length == 0) {
            let file = document.createElement("div");
            file.innerHTML = "No changes to commit.";
            list.appendChild(file);
            
        } else {
            for (let i = 0; i < fileChanged.length; i++) {
                let file = document.createElement("div");
                file.innerHTML = fileChanged[i];
                list.appendChild(file);
            }
        }
    });
}

function initCommit() {
    var app = document.getElementById("app");
    
    let form = document.createElement("form");
    app.appendChild(form);
    form.id = "commit-form";
    form.classList.add("popout-window");

    var i = document.createElement("input");
    i.type = "text";
    i.id = "commit-msg";
    i.placeholder = "Commit message (ctrl+enter to push)";
    i.style.width = "100%";

    var list = document.createElement("div");
    form.appendChild(list);
    form.appendChild(i);

    list.id = "commit-list";

    getChanged();

    i.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            let log = document.createElement("div");
            log.id = "commit-log";
            form.appendChild(log);
            i.remove();
            list.remove();

            commit(i.value, e.ctrlKey);
        }
            
        if (e.key === "Escape")
            form.remove();
    });

    i.focus();
}