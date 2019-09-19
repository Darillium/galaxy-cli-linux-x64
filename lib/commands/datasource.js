"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const inquirer = require("inquirer");
const axios_1 = require("axios");
// @ts-ignore
const node_persist_1 = require("node-persist");
const index_1 = require("../index");
const chalk_1 = require("chalk");
const login_1 = require("./login");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const cli_ux_1 = require("cli-ux");
class Datasource extends command_1.Command {
    constructor() {
        super(...arguments);
        this.datasources = [];
        this.selectedEntity = {};
        this.userObject = {};
    }
    async run() {
        const { args, flags } = this.parse(Datasource);
        if (await login_1.alreadyLoggedIn()) {
            let userChoice = {};
            if (!Object.values(args).find(a => a)) {
                userChoice = await this.localMenu();
            }
            await this.actionManager(userChoice);
        }
        else {
            this.error('you are not logged in...');
        }
    }
    async localMenu() {
        const list = {
            type: 'list',
            name: 'datasource',
            message: 'Select an action',
            choices: [
                'Create datasource',
                'List datasources',
                'Update datasource',
                'Archive datasource',
                'View datasource',
                'Delete datasource'
            ],
            default: 'List datasources',
        };
        // @ts-ignore
        const action = await inquirer.prompt(list);
        return action;
    }
    async actionManager(userChoice) {
        const { args, flags } = this.parse(Datasource);
        if (flags.file) {
            await index_1.copyFile(flags.file).then((res) => {
                this.userObject = JSON.parse(res.toString());
            });
        }
        if (args['Create/List/Update/Archive/View/Delete'] === 'create' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('create'))) {
            if (flags.file) {
                await this.injectUserFile('create');
            }
            else {
                await this.createTarget();
            }
        }
        if (args['Create/List/Update/Archive/View/Delete'] === 'list' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('list'))) {
            await this.listAllTargets(true);
        }
        if (args['Create/List/Update/Archive/View/Delete'] === 'view' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('view'))) {
            if (flags.id) {
                await this.listTarget(flags.id, true);
            }
            else {
                await this.select();
                await this.listTarget(this.selectedEntity['id'], true);
            }
        }
        if (args['Create/List/Update/Archive/View/Delete'] === 'update' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('update'))) {
            if (flags.file) {
                await this.injectUserFile('update');
            }
            else {
                if (flags.id) {
                    await this.updateTarget(flags.id);
                }
                else {
                    await this.select();
                    await this.updateTarget(this.selectedEntity['id']);
                }
            }
        }
        if (args['Create/List/Update/Archive/View/Delete'] === 'delete' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('delete'))) {
            if (flags.id) {
                await this.deleteTarget(flags.id);
            }
            else {
                await this.select();
                await this.deleteTarget(this.selectedEntity['id']);
            }
        }
        // await this.localMenu();
    }
    filterFields(obj, filters) {
        let filtered = {};
        for (let i in obj) {
            if (!filters.find(f => f === i)) {
                filtered[i] = obj[i];
            }
        }
        return filtered;
    }
    async injectUserFile(action) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('inject user file');
        // console.log('check that userObject is always defined here : ', this.userObject);
        switch (action) {
            case 'create':
                await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/datasources`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`New datasource created from custom file: OK`));
                    cli_ux_1.cli.action.stop();
                }).catch(error => {
                    cli_ux_1.cli.action.stop();
                    this.error('Catched error on creating new datasource from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            case 'update':
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/datasources`, this.userObject, config).then((res) => {
                    cli_ux_1.cli.action.stop();
                    console.log(chalk_1.default.green.bold(`Updated datasource from custom file: OK`));
                }).catch(error => {
                    if (this.userObject && this.userObject['id']) {
                        cli_ux_1.cli.action.stop();
                        this.error('Cannot update with this file because it has no ID field... ');
                    }
                    cli_ux_1.cli.action.stop();
                    this.error('Catched error on updating datasource from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            default:
                break;
        }
    }
    async showSelectedEntityMenu(answer) {
        const filteredFields = ['id'];
        let selected = { 'datasource': 'SEND UPDATE' };
        const choices = Object.keys(this.filterFields(this.selectedEntity, filteredFields));
        choices.push('SEND UPDATE');
        const list = {
            type: 'list',
            name: 'datasource',
            message: 'Select the field you want to update',
            choices: choices,
            default: Object.keys(this.selectedEntity)[0],
        };
        if (answer.toLowerCase() === 'i' || answer.toLowerCase() === 'interactive') {
            // @ts-ignore
            selected = await inquirer.prompt(list);
        }
        else {
            selected[list.name] = 'manual';
        }
        if (selected[list.name] === 'manual') {
            await fs_1.promises.writeFile("json-templates/edited-entity.json", JSON.stringify(this.selectedEntity, null, 2));
            const editor = process.env.EDITOR || 'vi';
            const child = child_process_1.spawn(editor, ['json-templates/edited-entity.json'], {
                stdio: 'inherit'
            });
            await child.on('exit', async (e, code) => {
                await index_1.copyFile('json-templates/edited-entity.json').then((newCode) => {
                    this.userObject = JSON.parse(newCode.toString());
                    // console.log("finished", this.userObject);
                });
                const config = {
                    headers: { 'Authorization': "bearer " + index_1.user.data.token }
                };
                // console.log('before updating app : ', this.selectedEntity);
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/datasources`, Object.assign({}, this.userObject), config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated datasource from cli editor: OK`));
                }).catch(error => {
                    console.log('Catched error on updating datasource from cli editor: ');
                });
                return;
            });
        }
        else if (selected[list.name] === 'SEND UPDATE') {
            const config = {
                headers: { 'Authorization': "bearer " + index_1.user.data.token }
            };
            // console.log('before updating app : ', this.selectedEntity);
            await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/datasources`, Object.assign({}, this.selectedEntity), config).then((res) => {
                console.log(chalk_1.default.green.bold(`Updated datasource: OK`));
            }).catch(error => {
                console.log('Catched error on updating datasource: ');
            });
            return;
        }
        else {
            this.log(chalk_1.default.blue.bold(`Current value of ${selected[list.name]}: ${this.selectedEntity[selected[list.name]]}`));
            const newValue = await index_1.hamdleMissingOption(selected[list.name], 'single', this.selectedEntity[selected[list.name]], null);
            this.selectedEntity[selected[list.name]] = newValue;
            await this.showSelectedEntityMenu(answer);
        }
    }
    async deleteTarget(targetId) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('deletio');
        await axios_1.default.delete(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/datasources/${targetId}`, config).then((res) => {
            cli_ux_1.cli.action.stop();
            this.log(chalk_1.default.green.bold(`DELETE datasource: OK`));
        }).catch(async (error) => {
            cli_ux_1.cli.action.stop();
            this.error('Catched error on DELETING datasource:');
        });
    }
    async updateTarget(targetId) {
        const { args, flags } = this.parse(Datasource);
        await this.listTarget(targetId, false);
        const filteredFields = ['id'];
        if (flags.name) {
            filteredFields.push('name');
            this.selectedEntity['name'] = flags.name;
        }
        if (flags.description) {
            filteredFields.push('description');
            this.selectedEntity['description'] = flags.description;
        }
        if (flags.type) {
            filteredFields.push('type');
            this.selectedEntity['type '] = flags.type;
        }
        const question = {
            type: `single`,
            name: `mode`,
            message: `Choose a mode: manual or interactive  (m/i)? `,
            default: 'manual',
        };
        const answer = await inquirer.prompt([question]);
        await this.showSelectedEntityMenu(answer[question.name].toString());
    }
    async select() {
        await this.listAllTargets(false);
        const choices = [];
        const map = {};
        if (this.datasources.length > 0) {
            this.datasources.forEach((ta) => {
                choices.push(ta['name'] + ' ' + ta['id']);
                map[ta['name'] + ' ' + ta['id']] = ta;
            });
            const list = {
                type: 'list',
                name: 'datasource',
                message: 'Select a datasource',
                choices: choices,
                default: choices[0],
            };
            // @ts-ignore
            const selected = await inquirer.prompt(list);
            this.selectedEntity = map[selected[list.name]];
            await node_persist_1.setItem('datasource', this.selectedEntity);
        }
        else {
            this.log(chalk_1.default.red.bold('There is no datasource yet, please create one'));
            process.exit(0);
        }
    }
    async listTarget(targetId, log) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('get target');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/datasources/${targetId}`, config).then((res) => {
            cli_ux_1.cli.action.stop();
            if (log) {
                this.log(chalk_1.default.green.bold(`VIEW datasource: OK`));
                index_1.showSingleTable(res['data']);
                //        console.info(res['data']);
            }
            this.selectedEntity = res['data'];
        }).catch(async (error) => {
            cli_ux_1.cli.action.stop();
            console.log(chalk_1.default.red.bold('Catched error on GETTING datasource: '));
            await this.select();
        });
    }
    async listAllTargets(log) {
        this.datasources = [];
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token },
            params: {
                'ns': index_1.user.data.namespaceId
            }
        };
        cli_ux_1.cli.action.start('get all');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/datasources`, config).then((res) => {
            cli_ux_1.cli.action.stop();
            if (log) {
                this.log(chalk_1.default.green.bold(`LIST datasources: OK`));
                const tableApps = [
                    { name: 'name', header: 'NAME', nestedField: null, subField: null },
                    { name: 'id', header: 'ID', nestedField: null, subField: null },
                    { name: 'description', header: null, nestedField: null, subField: null },
                    { name: 'type', header: null, nestedField: null, subField: null },
                    { name: 'url', header: 'Repo URL', nestedField: null, subField: null },
                    { name: 'credentialsSecretId', header: 'Secret ID', nestedField: null, subField: null },
                    { name: 'lastUpdate', header: 'last updated', nestedField: null, subField: null },
                ];
                index_1.showTable(res['data'], tableApps);
            }
            this.datasources = res['data'];
        }).catch(error => {
            console.log('Catched error on LISTING all datasources: ', error);
            return error['data'];
        });
    }
    async createTarget() {
        const { args, flags } = this.parse(Datasource);
        const name = flags.name || await index_1.hamdleMissingOption('name', 'single', 'myDatasource', null);
        const description = flags.description || await index_1.hamdleMissingOption('description', 'single', '', null);
        const url = flags.url || await index_1.hamdleMissingOption('repository url', 'single', 'no address', null);
        const type = flags.type || await index_1.hamdleMissingOption('type', 'multi', 'DOCKER', ['DOCKER', 'GITHUB', 'JFROG', 'BUCKET']);
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        const body = {
            name: name,
            namespaceId: index_1.user.data.namespaceId,
            owner: index_1.user.data.id,
            description: description,
            type: type,
            url: url
        };
        cli_ux_1.cli.action.start('creation');
        await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/datasources`, body, config).then((res) => {
            cli_ux_1.cli.action.stop();
            console.log(chalk_1.default.green.bold(`New datasource: OK. Its id is ${res['data']['id']}`));
            // console.info(res['data'])
        }).catch(error => {
            console.log('Catched error on creating new datasource: ');
            cli_ux_1.cli.action.stop();
        });
    }
}
exports.default = Datasource;
Datasource.description = 'Actions relative to datasource(s)';
Datasource.flags = {
    help: command_1.flags.help({ char: 'h' }),
    file: command_1.flags.string({ char: 'f', description: 'provide a json file representing a datasource' }),
    id: command_1.flags.string({ char: 'i', description: 'provide a datasource id' }),
    name: command_1.flags.string({ char: 'n', description: 'provide a name to update/create a datasource' }),
    description: command_1.flags.string({ char: 'd', description: 'provide a description to update/create a datasource' }),
    type: command_1.flags.string({ char: 't', description: 'provide a type to update/create a datasource. Ex: DOCKER, GITHUB, JFROG, DOCKER' }),
    url: command_1.flags.string({ char: 'u', description: 'provide an url for the repository address' }),
};
Datasource.args = [
    { name: 'Create/List/Update/Archive/View/Delete' },
];
