import UI from "../../functions/ui.js";

let interval = false;
let timer = false;

const drawModal = async function(){
    $('#lostServerConnection').modal('show');
};

const preventSubmitReload = document.getElementById("dotEnvForm");
if(preventSubmitReload){
    preventSubmitReload.addEventListener("submit", async e => {
        e.preventDefault();
        const form = e.target;

        form.submit(form);
        // const data = {
        //     appName: document.getElementById("appName").value,
        //     databaseURI: document.getElementById("databaseURI").value,
        //     serverPort: document.getElementById("serverPort").value,
        //     requireLogin:document.getElementById("requireLogin").value,
        //     requireRegistration: document.getElementById("requireRegistration").value,
        // };
        // const formData = new FormData();
        // data.forEach(d => {
        //     console.log(d);
        // });
        // formData.append("", undefined, undefined);
        // console.log(formData);
        // const postEnv = await fetch('/submitEnvironment', {
        //     method: 'POST', // or 'PUT'
        //     body: JSON.stringify(formData),
        // });
        // if(postEnv.status === 200){
        //     UI.createAlert("success", "Successfully completed setup... Server will now reboot!");
        // }else{
        //     UI.createAlert("error", "Could not contact server to update... please check the logs");
        // }
    });
}

const serverAliveCheck = async function(){
    if(!interval){
        setInterval(async () => {
            const modal = document.getElementById("lostServerConnection");
            try{
                let alive = await fetch('/serverAlive/');
                if(alive.status !== 200) throw "No Server Connection";
                alive = await alive.json();
                if(modal.classList.contains("show")){
                    //Connection recovered, re-load printer page
                    const spinner = document.getElementById("lostConnectionSpinner");
                    const text = document.getElementById("lostConnectionText");
                    spinner.className = "fas fa-spinner";

                    if(!timer){
                        let countDown = 5;
                        timer = true;
                        setInterval(() => {
                            text.innerHTML = "Connection Restored! <br> Reloading the page automatically in " + countDown + " seconds...";
                            countDown = countDown - 1;
                        }, 1000);
                        setTimeout(() => {
                            location.reload("/");
                        },6000);
                    }
                }
            }catch(e){
                drawModal();
                console.log(e);
                clearInterval(interval);
                interval = false;
                serverAliveCheck();
            }
        }, 1000);
    }
};

serverAliveCheck();