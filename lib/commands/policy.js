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
class Policy extends command_1.Command {
    constructor() {
        super(...arguments);
        this.userObject = {};
        this.policies = [];
        this.selectedEntity = {};
        this.updateCache = {};
    }
    async run() {
        const { args, flags } = this.parse(Policy);
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
            name: 'policy',
            message: 'Select an action',
            choices: [
                'Create policy',
                'List policies',
                'Update policy',
                'Archive policy',
                'View policy',
                'Implementation',
                'Delete policy'
            ],
            default: 'List policies',
        };
        // @ts-ignore
        const action = await inquirer.prompt(list);
        return action;
    }
    async actionManager(userChoice) {
        const { args, flags } = this.parse(Policy);
        if (flags.file) {
            await index_1.copyFile(flags.file).then((res) => {
                this.userObject = JSON.parse(res.toString());
            });
        }
        if (args['Create/List/Update/Archive/View/Implementation/Delete'] === 'create' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('create'))) {
            if (flags.file) {
                await this.injectUserFile('create');
            }
            else {
                await this.createTarget();
            }
        }
        if (args['Create/List/Update/Archive/View/Implementation/Delete'] === 'list' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('list'))) {
            await this.listAllTargets(true);
        }
        if (args['Create/List/Update/Archive/View/Implementation/Delete'] === 'view' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('view'))) {
            if (flags.id) {
                await this.listTarget(flags.id, true);
            }
            else {
                await this.select();
                await this.listTarget(this.selectedEntity['id'], true);
            }
        }
        if (args['Create/List/Update/Archive/View/Implementation/Delete'] === 'update' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('update'))) {
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
        if (args['Create/List/Update/Archive/View/Implementation/Delete'] === 'delete' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('delete'))) {
            if (flags.id) {
                await this.deleteTarget(flags.id);
            }
            else {
                await this.select();
                await this.deleteTarget(this.selectedEntity['id']);
            }
        }
        if (args['Create/List/Update/Archive/View/Implementation/Delete'] === 'implementation' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('implementation'))) {
            if (flags.id) {
                await this.handleImplementation(flags.id);
            }
            else {
                await this.select();
                await this.handleImplementation(this.selectedEntity['id']);
            }
        }
        // await this.localMenu();
    }
    async addImp() {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        const { args, flags } = this.parse(Policy);
        let provider = '';
        if (!flags.impProvider) {
            const list = {
                type: 'list',
                name: 'provider',
                message: 'Select a provider',
                choices: ['GCP', 'AWS', 'AZURE', 'KUBERNETES', 'CLOUDFOUNDRY', 'VREALIZE', 'ALIBABA'],
                default: 'GCP',
            };
            // @ts-ignore
            const selected = await inquirer.prompt(list);
            provider = selected[list.name];
        }
        else {
            provider = flags.impProvider.toUpperCase();
        }
        // IF NO HAVE PROVIDED
        if (!flags.file) {
            await fs_1.promises.writeFile("json-templates/implementations.json", JSON.stringify({ "key": "value" }, null, 2));
            const editor = process.env.EDITOR || 'vi';
            const child = child_process_1.spawn(editor, ['json-templates/implementations.json'], {
                stdio: 'inherit'
            });
            await child.on('exit', async (e, code) => {
                await index_1.copyFile('json-templates/implementations.json').then(async (newCode) => {
                    console.log("finished", newCode.toString());
                    if (this.selectedEntity['implementations']) {
                        console.log('the provider : ', this.selectedEntity['implementations']);
                        // we should handle Duplicated imp name before because it means update imp
                        if (this.selectedEntity['implementations'][provider]) {
                            await this.updateImp();
                            process.exit(0);
                        }
                        this.selectedEntity['implementations'][provider] = {};
                        this.selectedEntity['implementations'][provider]['source'] = null;
                        this.selectedEntity['implementations'][provider]['body'] = newCode.toString();
                        cli_ux_1.cli.action.start('update');
                        await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, Object.assign({}, this.selectedEntity), config).then((res) => {
                            cli_ux_1.cli.action.stop();
                            console.log(chalk_1.default.green.bold(`added implementation to policy ${res['data']['name']} from cli editor: OK. its id is: ${res['data']['id']}`));
                        }).catch(error => {
                            cli_ux_1.cli.action.stop();
                            this.log('Catched error on adding implementation to policy: ', error);
                        });
                    }
                });
                return;
            });
        }
        else {
            // IF  FILE PROVIDED
            let body = '';
            await index_1.copyFile(flags.file).then((res) => {
                body = JSON.parse(res.toString());
                this.selectedEntity['implementations'][provider] = {};
                this.selectedEntity['implementations'][provider]['source'] = null;
                this.selectedEntity['implementations'][provider]['body'] = JSON.stringify(body);
            });
            cli_ux_1.cli.action.start('update');
            await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, Object.assign({}, this.selectedEntity), config).then((res) => {
                cli_ux_1.cli.action.stop();
                console.log(chalk_1.default.green.bold(`added custom implementation to policy ${res['data']['name']} from local file: OK. its id is: ${res['data']['id']}`));
            }).catch(error => {
                cli_ux_1.cli.action.stop();
                this.log('Catched error on adding custom implementation from local file: ', error);
            });
        }
    }
    async updateImp() {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        const { args, flags } = this.parse(Policy);
        let provider = '';
        if (!flags.impProvider) {
            const list = {
                type: 'list',
                name: 'implementation',
                message: 'Select an implementation to update',
                choices: Object.keys(this.selectedEntity['implementations']),
                default: Object.keys(this.selectedEntity['implementations'])[0],
            };
            // @ts-ignore
            const selected = await inquirer.prompt(list);
            provider = selected[list.name];
        }
        else {
            provider = flags.impProvider.toUpperCase();
            if (!this.selectedEntity['implementations'][provider]) {
                this.log(`${provider} could not be found in the implementations...
        showing you the list of implementations for ${this.selectedEntity['name']}`);
                flags.impProvider = undefined;
                await this.updateImp();
            }
        }
        this.log('here we are set up');
        await fs_1.promises.writeFile("json-templates/implementations.json", JSON.stringify(this.selectedEntity['implementations'][provider]['body'], null, 2));
        const editor = process.env.EDITOR || 'vi';
        const child = child_process_1.spawn(editor, ['json-templates/implementations.json'], {
            stdio: 'inherit'
        });
        await child.on('exit', async (e, code) => {
            await index_1.copyFile('json-templates/implementations.json').then(async (newCode) => {
                if (this.selectedEntity['implementations']) {
                    this.selectedEntity['implementations'][provider]['body'] = newCode.toString();
                    console.log('######### the selected entity : ', this.selectedEntity);
                    cli_ux_1.cli.action.start('update');
                    await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, Object.assign({}, this.selectedEntity), config).then((res) => {
                        cli_ux_1.cli.action.stop();
                        console.log(chalk_1.default.green.bold(`updated implementation to policy ${res['data']['name']} from cli editor: OK. its id is: ${res['data']['id']}`));
                    }).catch(error => {
                        cli_ux_1.cli.action.stop();
                        this.log('Catched error on updating implementation to policy: ', error);
                    });
                }
            });
            return;
        });
    }
    async removeImp() {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        const { args, flags } = this.parse(Policy);
        let provider = '';
        if (!flags.impProvider) {
            const list = {
                type: 'list',
                name: 'implementation',
                message: 'Which implementation do you want to remove ?',
                choices: Object.keys(this.selectedEntity['implementations']),
                default: Object.keys(this.selectedEntity['implementations'])[0],
            };
            // @ts-ignore
            const toBeRemoved = await inquirer.prompt(list);
            provider = toBeRemoved[list.name];
        }
        else {
            provider = flags.impProvider.toUpperCase();
            if (!this.selectedEntity['implementations'][provider]) {
                this.log(`${provider} could not be found in the implementations...
        showing you the list of implementations for ${this.selectedEntity['name']}`);
                flags.impProvider = undefined;
                await this.removeImp();
            }
        }
        const cleansedEntity = {};
        for (const imp in this.selectedEntity['implementations']) {
            if (imp !== provider) {
                cleansedEntity[imp] = this.selectedEntity['implementations'][imp];
            }
        }
        console.log('FINAL TOUCH: ', cleansedEntity);
        this.selectedEntity['implementations'] = cleansedEntity;
        cli_ux_1.cli.action.start('update');
        await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, Object.assign({}, this.selectedEntity), config).then((res) => {
            console.log(chalk_1.default.green.bold(`removed implementation to policy ${res['data']['name']} from cli editor: OK.`));
            cli_ux_1.cli.action.stop();
        }).catch(error => {
            this.log('Catched error on removing implementation to policy: ', error);
            cli_ux_1.cli.action.stop();
        });
    }
    async handleImplementation(targetId) {
        console.log('handling implementations ');
        const { args, flags } = this.parse(Policy);
        await this.listTarget(targetId, false);
        if (this.selectedEntity['orgId'] === null) {
            this.error(`${this.selectedEntity['name']} seems to be a system policy. It cannot be modified. Terminating process`);
        }
        cli_ux_1.cli.action.stop();
        if (flags.file) {
            await this.addImp();
        }
        else if (flags.impAdd) {
            await this.addImp();
        }
        else if (flags.impUpdate) {
            await this.updateImp();
        }
        else if (flags.impRemove) {
            await this.removeImp();
        }
        if (!flags.impRemove && !flags.impAdd && !flags.impUpdate && !flags.file) {
            const list = {
                type: 'list',
                name: 'impAction',
                message: 'Select a type of action for implementations',
                choices: ['add', 'update', 'remove'],
                default: Object.keys(this.selectedEntity)[0],
            };
            // @ts-ignore
            const selected = await inquirer.prompt(list);
            switch (selected[list.name]) {
                case 'add':
                    await this.addImp();
                    break;
                case 'update':
                    await this.updateImp();
                    break;
                case 'remove':
                    await this.removeImp();
                    break;
                default:
                    break;
            }
        }
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
    async showSelectedEntityMenu(answer) {
        const { args, flags } = this.parse(Policy);
        const filteredFields = ['id'];
        let selected = { 'policy': 'SEND UPDATE' };
        const choices = Object.keys(this.filterFields(this.selectedEntity, filteredFields));
        choices.push('SEND UPDATE');
        const list = {
            type: 'list',
            name: 'policy',
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
                cli_ux_1.cli.action.start('update');
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, Object.assign({}, this.userObject), config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated policy from cli editor: OK`));
                    cli_ux_1.cli.action.stop();
                }).catch(error => {
                    console.log('Catched error on updating policy from cli editor: ');
                    cli_ux_1.cli.action.stop();
                });
                return;
            });
        }
        else if (selected[list.name] === 'SEND UPDATE') {
            const config = {
                headers: { 'Authorization': "bearer " + index_1.user.data.token }
            };
            // console.log('before updating app : ', this.selectedEntity);
            cli_ux_1.cli.action.start('update');
            await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, Object.assign({}, this.selectedEntity), config).then((res) => {
                console.log(chalk_1.default.green.bold(`Updated policy: OK`));
                cli_ux_1.cli.action.stop();
            }).catch(error => {
                console.log('Catched error on updating policy: ');
                cli_ux_1.cli.action.stop();
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
        await this.listTarget(targetId, false);
        if (this.selectedEntity['orgId'] === null) {
            this.error(`${this.selectedEntity['name']} seems to be a system policy. It cannot be modified. Terminating process`);
        }
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('delete');
        await axios_1.default.delete(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies/${targetId}`, config).then((res) => {
            this.log(chalk_1.default.green.bold(`DELETE policy: OK`));
            cli_ux_1.cli.action.stop();
        }).catch(async (error) => {
            console.log('Catched error on DELETING policy: ');
            cli_ux_1.cli.action.stop();
        });
    }
    async injectUserFile(action) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('');
        // console.log('check that userObject is always defined here : ', this.userObject);
        switch (action) {
            case 'create':
                await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`New policy create from custom file: OK. Its id is: ${res['data']['id']}`));
                }).catch(error => {
                    this.error('Catched error on creating new policy from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            case 'update':
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated policy from custom file: OK`));
                }).catch(error => {
                    if (this.userObject && !this.userObject['id']) {
                        this.error('Cannot update with this file because it has no ID field... ');
                    }
                    console.log('Catched error on updating policy from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            default:
                break;
        }
        cli_ux_1.cli.action.stop();
    }
    async updateTarget(targetId) {
        const { args, flags } = this.parse(Policy);
        await this.listTarget(targetId, false);
        if (this.selectedEntity['orgId'] === null) {
            this.error(`${this.selectedEntity['name']} seems to be a system policy. It cannot be modified. Terminating process`);
        }
        const filteredFields = ['id'];
        if (flags.name) {
            filteredFields.push('name');
            this.selectedEntity['name'] = flags.name;
        }
        if (flags.description) {
            filteredFields.push('description');
            this.selectedEntity['description'] = flags.description;
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
        cli_ux_1.cli.action.stop();
        const choices = [];
        const map = {};
        if (this.policies.length > 0) {
            this.policies.forEach((ta) => {
                choices.push(ta['name'] + ' ' + ta['id']);
                map[ta['name'] + ' ' + ta['id']] = ta;
            });
            const list = {
                type: 'list',
                name: 'policy',
                message: 'Select a policy',
                choices: choices,
                default: choices[0],
            };
            // @ts-ignore
            const selected = await inquirer.prompt(list);
            this.selectedEntity = map[selected[list.name]];
            await node_persist_1.setItem('policy', this.selectedEntity);
        }
        else {
            this.log(chalk_1.default.red.bold('There is no policy yet, please create one'));
            process.exit(0);
        }
    }
    async listTarget(targetId, log) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('get');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies/${targetId}`, config).then((res) => {
            if (log) {
                this.log(chalk_1.default.green.bold(`VIEW policy: OK`));
                cli_ux_1.cli.action.stop();
                index_1.showSingleTable(res['data']);
            }
            this.selectedEntity = res['data'];
        }).catch(async (error) => {
            cli_ux_1.cli.action.stop();
            console.log(chalk_1.default.red.bold('Catched error on GETTING policy: '));
            // await this.select();
        });
    }
    async listAllTargets(log) {
        this.policies = [];
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('get all');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, config).then((res) => {
            if (log) {
                this.log(chalk_1.default.green.bold(`LIST policies: OK`));
                const tablePols = [
                    { name: 'name', header: 'NAME', nestedField: null, subField: null },
                    { name: 'id', header: 'ID', nestedField: null, subField: null },
                    { name: 'description', header: null, nestedField: null, subField: null },
                    { name: 'lastUpdate', header: 'last updated', nestedField: null, subField: null },
                    { name: 'ownerId', header: 'Owner ID', nestedField: null, subField: null },
                ];
                cli_ux_1.cli.action.stop();
                index_1.showTable(res['data'], tablePols);
            }
            this.policies = res['data'];
        }).catch(error => {
            console.log('Catched error on LISTING all policies: ', error);
            cli_ux_1.cli.action.stop();
            return error['data'];
        });
    }
    async createTarget() {
        const { args, flags } = this.parse(Policy);
        const name = flags.name || await index_1.hamdleMissingOption('name', 'single', 'myPolicy', null);
        const description = flags.description || await index_1.hamdleMissingOption('description', 'single', '', null);
        const orgId = index_1.user.data.orgId;
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        const body = {
            name: name,
            namespaceId: index_1.user.data.namespaceId,
            ownerId: index_1.user.data.id,
            description: description,
            orgId: orgId,
            implementations: {}
        };
        cli_ux_1.cli.action.start('create');
        await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/policies`, body, config).then((res) => {
            console.log(chalk_1.default.green.bold(`New custom policy: OK. its id is : ${res['data']['id']}`));
            cli_ux_1.cli.action.stop();
            // console.info(res['data'])
        }).catch(error => {
            console.log('Catched error on creating new custom policy: ');
            cli_ux_1.cli.action.stop();
        });
    }
}
exports.default = Policy;
Policy.description = 'Actions on custom policies';
Policy.flags = {
    help: command_1.flags.help({ char: 'h' }),
    id: command_1.flags.string({ char: 'i', description: 'provide a policy id' }),
    file: command_1.flags.string({ char: 'f', description: 'provide a json file representing a policy' }),
    name: command_1.flags.string({ char: 'n', description: 'provide a name to create/update a policy' }),
    description: command_1.flags.string({ char: 'd', description: 'provide a description to create/update a policy' }),
    // code: flags.string({char: 'c'}),
    impAdd: command_1.flags.boolean({ char: 'a', exclusive: ['impUpdate', 'impRemove'], description: 'dependent of [IMPLEMENTATION] command. Indicates you wanna add an implementation' }),
    impUpdate: command_1.flags.boolean({ char: 'u', exclusive: ['impAdd', 'impRemove'], description: 'dependent of [IMPLEMENTATION] command. Indicates you wanna update an implementation' }),
    impRemove: command_1.flags.boolean({ char: 'r', exclusive: ['impAdd', 'impUpdate'], description: 'dependent of [IMPLEMENTATION] command. Indicates you wanna remove an implementation' }),
    impProvider: command_1.flags.string({ char: 'p', dependsOn: ['impAdd', 'impUpdate'], description: 'dependent of --impAdd or --impUpdate command. Indicates the provider of the implementation' }),
};
Policy.args = [
    { name: 'Create/List/Update/Archive/View/Implementation/Delete' },
];
