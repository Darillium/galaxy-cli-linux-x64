"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const login_1 = require("./login");
const inquirer = require("inquirer");
// @ts-ignore
const node_persist_1 = require("node-persist");
const cli_ux_1 = require("cli-ux");
const index_1 = require("../index");
const axios_1 = require("axios");
const chalk_1 = require("chalk");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
class Application extends command_1.Command {
    constructor() {
        super(...arguments);
        this.applications = [];
        this.selectedEntity = {};
        this.userObject = {};
    }
    async run() {
        const { args, flags } = this.parse(Application);
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
            name: 'application',
            message: 'Select an action',
            choices: [
                'Create application',
                'List applications',
                'Update application',
                'Archive application',
                'View application',
                'Delete application'
            ],
            default: 'List applications',
        };
        // @ts-ignore
        const action = await inquirer.prompt(list);
        return action;
    }
    async actionManager(userChoice) {
        const { args, flags } = this.parse(Application);
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
        // console.log('check that userObject is always defined here : ', this.userObject);
        switch (action) {
            case 'create':
                await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/applications`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`New application create from custom file: OK. Its id is: ${res['data']['id']}`));
                }).catch(error => {
                    this.error('Catched error on creating new application from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            case 'update':
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/applications`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated application from custom file: OK`));
                }).catch(error => {
                    if (this.userObject && this.userObject['id']) {
                        this.error('Cannot update with this file because it has no ID field... ');
                    }
                    console.log('Catched error on updating application from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            default:
                break;
        }
    }
    async showSelectedEntityMenu(answer) {
        const { args, flags } = this.parse(Application);
        const filteredFields = ['id'];
        let selected = { 'application': 'SEND UPDATE' };
        const choices = Object.keys(this.filterFields(this.selectedEntity, filteredFields));
        choices.push('SEND UPDATE');
        const list = {
            type: 'list',
            name: 'application',
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
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/applications`, Object.assign({}, this.userObject), config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated application from cli editor: OK`));
                }).catch(error => {
                    console.log('Catched error on updating application from cli editor: ');
                });
                return;
            });
        }
        else if (selected[list.name] === 'SEND UPDATE') {
            const config = {
                headers: { 'Authorization': "bearer " + index_1.user.data.token }
            };
            // console.log('before updating app : ', this.selectedEntity);
            await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/applications`, Object.assign({}, this.selectedEntity), config).then((res) => {
                console.log(chalk_1.default.green.bold(`Updated application: OK`));
            }).catch(error => {
                console.log('Catched error on updating application: ');
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
        await axios_1.default.delete(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/applications/${targetId}`, config).then((res) => {
            this.log(chalk_1.default.green.bold(`DELETE application: OK`));
        }).catch(async (error) => {
            console.log('Catched error on DELETING application:');
        });
    }
    async updateTarget(targetId) {
        const { args, flags } = this.parse(Application);
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
        if (this.applications.length > 0) {
            this.applications.forEach((ta) => {
                choices.push(ta['name'] + ' ' + ta['id']);
                map[ta['name'] + ' ' + ta['id']] = ta;
            });
            const list = {
                type: 'list',
                name: 'application',
                message: 'Select a application',
                choices: choices,
                default: choices[0],
            };
            // @ts-ignore
            const selected = await inquirer.prompt(list);
            this.selectedEntity = map[selected[list.name]];
            await node_persist_1.setItem('application', this.selectedEntity);
        }
        else {
            this.log(chalk_1.default.red.bold('There is no application yet, please create one'));
            process.exit(0);
        }
    }
    async listTarget(targetId, log) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/applications/${targetId}`, config).then((res) => {
            if (log) {
                this.log(chalk_1.default.green.bold(`VIEW application: OK`));
                index_1.showSingleTable(res['data']);
                //        console.info(res['data']);
            }
            this.selectedEntity = res['data'];
        }).catch(async (error) => {
            console.log(chalk_1.default.red.bold('Catched error on GETTING application: '));
            await this.select();
        });
    }
    async listAllTargets(log) {
        this.applications = [];
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.default.action.start('starting a process');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/applications`, config).then((res) => {
            cli_ux_1.default.action.stop();
            if (log) {
                this.log(chalk_1.default.green.bold(`LIST applications: OK`));
                const tableApps = [
                    { name: 'name', header: 'NAME', nestedField: null, subField: null },
                    { name: 'id', header: 'ID', nestedField: null, subField: null },
                    { name: 'description', header: null, nestedField: null, subField: null },
                    { name: 'lastUpdate', header: 'last updated', nestedField: null, subField: null },
                    { name: 'type', header: null, nestedField: null, subField: null },
                    { name: 'memoryLimit', header: 'memory limit', nestedField: null, subField: null },
                    { name: 'cpuLimit', header: 'CPU limit', nestedField: null, subField: null },
                    { name: 'imageUrl', header: 'image URL', nestedField: null, subField: null },
                ];
                res['data'].forEach((app) => {
                    if (app['runtimeParams']) {
                        for (let paramName in app['runtimeParams']) {
                            tableApps.push({ name: paramName, header: paramName, nestedField: 'runtimeParams', subField: null });
                        }
                    }
                });
                index_1.showTable(res['data'], tableApps);
            }
            this.applications = res['data'];
        }).catch(error => {
            console.log('Catched error on LISTING all applications: ', error);
            return error['data'];
        });
    }
    async createTarget() {
        const { args, flags } = this.parse(Application);
        const name = flags.name || await index_1.hamdleMissingOption('name', 'single', 'myApp', null);
        const description = flags.description || await index_1.hamdleMissingOption('description', 'single', '', null);
        const type = flags.type || await index_1.hamdleMissingOption('type', 'single', 'NPM', null);
        const orgId = index_1.user.data.orgId;
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        const body = {
            name: name,
            namespaceId: index_1.user.data.namespaceId,
            owner: index_1.user.data.id,
            description: description,
            type: type,
        };
        // console.log('Sending ! ', body)
        await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/applications`, body, config).then((res) => {
            console.log(chalk_1.default.green.bold(`New application: OK`));
            // console.info(res['data'])
        }).catch(error => {
            console.log('Catched error on creating new application: ');
        });
    }
}
exports.default = Application;
Application.description = 'Actions on applications';
Application.flags = {
    help: command_1.flags.help({ char: 'h' }),
    file: command_1.flags.string({ char: 'f', description: 'provide a json file representing an app' }),
    id: command_1.flags.string({ char: 'i', description: 'provide an app id' }),
    // name: flags.string({char: 'n', description: 'name to print'}),
    name: command_1.flags.string({ char: 'n', description: 'provide a name to update/create an app' }),
    description: command_1.flags.string({ char: 'd', description: 'provide a description to update/create an app' }),
    // startDate: flags.string({char: 's'}),
    // finishDate: flags.string({char: 'f'}),
    type: command_1.flags.string({ char: 't', description: 'provide a type to update/create an app. Ex: NPM, JAR' }),
};
Application.args = [
    { name: 'Create/List/Update/Archive/View/Delete' },
];
