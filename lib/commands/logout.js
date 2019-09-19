"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const login_1 = require("./login");
// @ts-ignore
const node_persist_1 = require("node-persist");
const chalk_1 = require("chalk");
class Logout extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(Logout);
        if (await login_1.alreadyLoggedIn()) {
            this.resetData();
        }
        else {
            this.log(`you are not logged in...`);
        }
    }
    async resetData() {
        console.error(chalk_1.default.blue.bold('Disconnecting the user ..... bye bye !!'));
        await node_persist_1.setItem('userData', null);
        await node_persist_1.setItem('userFull', null);
        process.exit(1);
    }
}
exports.default = Logout;
Logout.description = 'Log out safely';
Logout.examples = [
    `$ galaxy logout
Disconnecting the user...bye bye
`,
];
Logout.flags = {
    help: command_1.flags.help({ char: 'h' }),
    force: command_1.flags.boolean({ char: 'f' }),
};
Logout.args = [];
