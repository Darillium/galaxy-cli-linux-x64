"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const axios_1 = require("axios");
const login_1 = require("./login");
// @ts-ignore
const node_persist_1 = require("node-persist");
const index_1 = require("../index");
const chalk_1 = require("chalk");
const cli_ux_1 = require("cli-ux");
const inquirer = require("inquirer");
class Namespace extends command_1.Command {
    constructor() {
        super(...arguments);
        this.namespaces = [];
    }
    async run() {
        const { args, flags } = this.parse(Namespace);
        if (await login_1.alreadyLoggedIn()) {
            //   console.log(chalk.blue.bold(`Current namespace id: `, user.data.namespaceId ));
            await this.selectNamespace();
        }
        else {
            this.error('you are not logged in...');
        }
    }
    async selectNamespace() {
        await this.getNamespaces();
        const choices = [];
        for (var i = 0; i <= this.namespaces.length - 1; i++) {
            choices.push(this.namespaces[i]['name']);
        }
        const list = {
            type: 'list',
            name: 'namespace',
            message: 'Select a namespace',
            choices: choices,
            default: choices[0],
        };
        // @ts-ignore
        const selectedNamespace = await inquirer.prompt(list);
        if (this.namespaces.find(ns => ns['name'] === selectedNamespace[list.name])) {
            // @ts-ignore
            index_1.user.data.namespaceId = this.namespaces.find(ns => ns.name === selectedNamespace[list.name])['id'];
            node_persist_1.setItem('userData', index_1.user.data);
            cli_ux_1.default.table([index_1.user.data], {
                token: {
                    minWidth: 2,
                },
                namespaceId: {
                    header: 'Namespace ID'
                },
                orgId: {
                    header: 'Organisation ID'
                },
                id: {
                    header: 'ID',
                    extended: true
                }
            }, {
                printLine: this.log,
            });
            // @ts-ignore
            console.log(chalk_1.default.green.bold(`Current namespace is now`, this.namespaces.find(ns => ns.name === selectedNamespace[list.name])['name']));
        }
    }
    async getNamespaces() {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.default.action.start('getting namespaces');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/organisations/${index_1.user.data.orgId}/namespaces`, config).then((res) => {
            console.log(chalk_1.default.green.bold(`Get all namespaces: OK`, res['data']));
            this.namespaces = res['data'];
            cli_ux_1.default.action.stop();
            // return new Promise(resolve => {resolve(res['data'])});
        }).catch(error => {
            console.log(chalk_1.default.red.bold('Catched error on GETTING all namespaces: '));
            cli_ux_1.default.action.stop();
        });
    }
}
exports.default = Namespace;
Namespace.description = 'Select a different namespace';
Namespace.flags = {
    help: command_1.flags.help({ char: 'h' }),
};
Namespace.args = [];
