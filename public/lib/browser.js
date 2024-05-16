import { global } from "./global.js";
import { util } from "./util.js";

const browser = class {
    constructor() {
        this.serverSelector = document.getElementById("serverSelector");
        this.tbody = document.createElement("tbody");
        this._ping = Number.MAX_SAFE_INTEGER;
        this.isMultiserver = false;
        this.myServer = {
            classList: {
                contains: () => false,
            },
        };
    };

    select(tr, ip, protocol, closed) {
        if (this.myServer.classList.contains("selected")) {
            this.myServer.classList.remove("selected");
        }
        tr.classList.add(closed ? "selected_yellow" : "selected");
        this.serverAdd = ip;
        this.protocol = protocol;
        global.mockupLoading = new Promise(Resolve => {
            util.pullJSON("mockups").then(data => {
                global.mockups = data;
                console.log('Mockups loading complete.');
                Resolve();
            });
        });
    };

    async init() {
        this.servers = await (await fetch("/servers.json")).json();

        if (this.servers.length) {
            document.getElementById("serverName").remove();
            this.isMultiserver = true;

            this.serverAdd = this.servers[0].ip;
            this.protocol = this.servers[0].protocol;
            this.serverSelector.style.display = "block";
            this.serverSelector.classList.add("serverSelector");
            this.serverSelector.classList.add("shadowscroll");
            this.serverSelector.appendChild(this.tbody);
        } else {
            document.getElementById("serverName").innerHTML = "<h4 class='nopadding'>No servers found</h4>";
        }

        for (let { server, ping, protocol, ip } of this.servers) {
            if (server.hidden) continue;
            try {
                let tr = document.createElement("tr"),
                    td1 = document.createElement("td"),
                    td2 = document.createElement("td"),
                    td3 = document.createElement("td");

                td1.style.width = "40px";
                td2.style.width = "250px";
                td3.style.width = "40px";
                td1.textContent = `${server.location == "" ? ip : server.location}`;
                td2.textContent = `${server.gameMode}`;
                td3.textContent = `${server.players}`;

                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);

                tr.onclick = () => {
                    this.select(tr, ip, protocol, server.closed);
                    this.myServer = tr;
                };

                if (this._ping > ping) {
                    this.select(tr, ip, protocol, server.closed);
                    this._ping = ping;
                }

                this.tbody.appendChild(tr);
                this.myServer = tr;
            } catch (e) {
                console.log(e);
            }
        }
    };
};

export { browser }
