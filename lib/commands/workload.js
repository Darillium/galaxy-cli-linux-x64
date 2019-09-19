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
class Workload extends command_1.Command {
    constructor() {
        super(...arguments);
        this.userObject = {};
        this.workloads = [];
        this.selectedEntity = {};
        this.updateCache = {};
    }
    async run() {
        const { args, flags } = this.parse(Workload);
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
            name: 'workload',
            message: 'Select an action',
            choices: [
                'Create workload',
                'List workloads',
                'Update workload',
                'Archive workload',
                'View workload',
                'Clone workload',
                'Delete workload'
            ],
            default: 'List workloads',
        };
        // @ts-ignore
        const action = await inquirer.prompt(list);
        return action;
    }
    async actionManager(userChoice) {
        const { args, flags } = this.parse(Workload);
        if (flags.file) {
            await index_1.copyFile(flags.file).then((res) => {
                this.userObject = JSON.parse(res.toString());
            });
        }
        if (args['Create/List/Update/Archive/View/Clone/Delete'] === 'create' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('create'))) {
            if (flags.file) {
                await this.injectUserFile('create');
            }
            else {
                await this.createTarget();
            }
        }
        if (args['Create/List/Update/Archive/View/Clone/Delete'] === 'list' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('list'))) {
            await this.listAllTargets(true);
        }
        if (args['Create/List/Update/Archive/View/Clone/Delete'] === 'view' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('view'))) {
            if (flags.id) {
                await this.listTarget(flags.id, true);
            }
            else {
                await this.select();
                await this.listTarget(this.selectedEntity['id'], true);
            }
        }
        if (args['Create/List/Update/Archive/View/Clone/Delete'] === 'update' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('update'))) {
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
        if (args['Create/List/Update/Archive/View/Clone/Delete'] === 'delete' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('delete'))) {
            if (flags.id) {
                await this.deleteTarget(flags.id);
            }
            else {
                await this.select();
                await this.deleteTarget(this.selectedEntity['id']);
            }
        }
        if (args['Create/List/Update/Archive/View/Clone/Delete'] === 'clone' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('clone'))) {
            if (flags.id) {
                await this.cloneTarget(flags.id);
            }
            else {
                await this.select();
                await this.cloneTarget(this.selectedEntity['id']);
            }
        }
        if (args['Create/List/Update/Archive/View/Clone/Delete'] === 'archive' || (Object.values(userChoice)[0] && Object.values(userChoice)[0].toLowerCase().includes('archive'))) {
            if (flags.id) {
                await this.archiveWorkload(flags.id);
            }
            else {
                await this.select();
                await this.archiveWorkload(this.selectedEntity['id']);
            }
        }
    }
    async cloneTarget(targetId) {
        await this.listTarget(targetId, false);
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('clone');
        await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads/${targetId}/clone`, null, config).then((res) => {
            console.log(chalk_1.default.green.bold(`Successfully cloned workload : OK. Its id is : ${res['data']['id']}`));
            cli_ux_1.cli.action.stop();
            // console.info(res['data'])
        }).catch(error => {
            console.log('Catched error on creating new workload: ');
            cli_ux_1.cli.action.stop();
        });
    }
    async archiveWorkload(targetId) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('get');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads/${targetId}/archive`, config).then((res) => {
            console.log(chalk_1.default.green.bold(`Successfully archived workload : OK`));
            cli_ux_1.cli.action.stop();
            // console.info(res['data'])
        }).catch(error => {
            console.log('Catched error on archiving workload: ');
            cli_ux_1.cli.action.stop();
        });
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
        const { args, flags } = this.parse(Workload);
        const filteredFields = ['id'];
        let selected = { 'workload': 'SEND UPDATE' };
        const choices = Object.keys(this.filterFields(this.selectedEntity, filteredFields));
        choices.push('SEND UPDATE');
        const list = {
            type: 'list',
            name: 'workload',
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
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads`, Object.assign({}, this.userObject), config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated workload from cli editor: OK`));
                    cli_ux_1.cli.action.stop();
                }).catch(error => {
                    console.log('Catched error on updating workload from cli editor: ');
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
            await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads`, Object.assign({}, this.selectedEntity), config).then((res) => {
                console.log(chalk_1.default.green.bold(`Updated workload: OK`));
                cli_ux_1.cli.action.stop();
            }).catch(error => {
                console.log('Catched error on updating workload: ');
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
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('delete');
        cli_ux_1.cli.action.stop();
        await axios_1.default.delete(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads/${targetId}`, config).then((res) => {
            this.log(chalk_1.default.green.bold(`DELETE workload: OK`));
            cli_ux_1.cli.action.stop();
        }).catch(async (error) => {
            console.log('Catched error on DELETING workload: ');
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
                await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`New workload create from custom file: OK. Its id is: ${res['data']['id']}`));
                }).catch(error => {
                    this.error('Catched error on creating new workload from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            case 'update':
                await axios_1.default.put(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads`, this.userObject, config).then((res) => {
                    console.log(chalk_1.default.green.bold(`Updated workload from custom file: OK`));
                }).catch(error => {
                    if (this.userObject && this.userObject['id']) {
                        this.error('Cannot update with this file because it has no ID field... ');
                    }
                    console.log('Catched error on updating workload from custom file. It is possible that sth is wrong in your file.');
                });
                break;
            default:
                break;
        }
        cli_ux_1.cli.action.stop();
    }
    async updateTarget(targetId) {
        const { args, flags } = this.parse(Workload);
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
        if (flags.completion) {
            filteredFields.push('completion');
            this.selectedEntity['completion '] = flags.completion;
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
        cli_ux_1.cli.action.stop();
        await this.listAllTargets(false);
        const choices = [];
        const map = {};
        if (this.workloads.length > 0) {
            this.workloads.forEach((ta) => {
                choices.push(ta['name'] + ' ' + ta['id']);
                map[ta['name'] + ' ' + ta['id']] = ta;
            });
            const list = {
                type: 'list',
                name: 'workload',
                message: 'Select a workload',
                choices: choices,
                default: choices[0],
            };
            // @ts-ignore
            const selected = await inquirer.prompt(list);
            this.selectedEntity = map[selected[list.name]];
            await node_persist_1.setItem('workload', this.selectedEntity);
        }
        else {
            this.log(chalk_1.default.red.bold('There is no workload yet, please create one'));
            process.exit(0);
        }
    }
    async listTarget(targetId, log) {
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        cli_ux_1.cli.action.start('get');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads/${targetId}`, config).then((res) => {
            if (log) {
                this.log(chalk_1.default.green.bold(`VIEW workload: OK`));
                cli_ux_1.cli.action.stop();
                index_1.showSingleTable(res['data']);
            }
            this.selectedEntity = res['data'];
        }).catch(async (error) => {
            cli_ux_1.cli.action.stop();
            console.log(chalk_1.default.red.bold('Catched error on GETTING workload: '));
            await this.select();
        });
    }
    async listAllTargets(log) {
        this.workloads = [];
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        // console.log('before this get all')
        cli_ux_1.cli.action.start('get all');
        await axios_1.default.get(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads?nsId=${index_1.user.data.namespaceId}`, config).then((res) => {
            if (log) {
                this.log(chalk_1.default.green.bold(`LIST workloads: OK`));
                const tableWkd = [
                    { name: 'name', header: 'NAME', nestedField: null, subField: null },
                    { name: 'id', header: 'ID', nestedField: null, subField: null },
                    { name: 'description', header: null, nestedField: null, subField: null },
                    { name: 'lastUpdate', header: 'last updated', nestedField: null, subField: null },
                ];
                index_1.showTable(res['data'], tableWkd);
            }
            cli_ux_1.cli.action.stop();
            this.workloads = res['data'];
        }).catch(error => {
            console.log('Catched error on LISTING all worklaods: ', error);
            cli_ux_1.cli.action.stop();
            return error['data'];
        });
    }
    async createTarget() {
        const { args, flags } = this.parse(Workload);
        const name = flags.name || await index_1.hamdleMissingOption('name', 'single', 'myWorkload', null);
        const description = flags.description || await index_1.hamdleMissingOption('description', 'single', '', null);
        const completion = flags.completion || await index_1.hamdleMissingOption('completion', 'single', '0', null);
        // const startDate = flags.startDate  || await hamdleMissingOption('startDate', 'single', '1-01-2020');
        // const finishDate = flags.finishDate  || await hamdleMissingOption('finishDate', 'single', '1-01-2020');
        const orgId = index_1.user.data.orgId;
        const config = {
            headers: { 'Authorization': "bearer " + index_1.user.data.token }
        };
        const body = {
            name: name,
            namespaceId: index_1.user.data.namespaceId,
            owner: index_1.user.data.id,
            description: description,
            // orgId: orgId,
            completionPercentage: completion,
        };
        // console.log('Sending ! ', body)
        cli_ux_1.cli.action.start('create');
        await axios_1.default.post(`${index_1.protocol}${login_1.globalFlags.target}/${index_1.version}/workloads`, body, config).then((res) => {
            console.log(chalk_1.default.green.bold(`New workload: OK`));
            cli_ux_1.cli.action.stop();
            // console.info(res['data'])
        }).catch(error => {
            console.log('Catched error on creating new workload: ');
            cli_ux_1.cli.action.stop();
        });
    }
}
exports.default = Workload;
Workload.description = 'Actions on workload(s)';
Workload.flags = {
    help: command_1.flags.help({ char: 'h' }),
    id: command_1.flags.string({ char: 'i', description: 'provide a workload id' }),
    file: command_1.flags.string({ char: 'f', description: 'provide a json file representing a workload' }),
    name: command_1.flags.string({ char: 'n', description: 'provide a name to create/update a workload' }),
    description: command_1.flags.string({ char: 'd', description: 'provide a description to create/update a workload' }),
    completion: command_1.flags.string({ char: 'c', description: 'provide a completion percentage to create/update a workload' }),
};
Workload.args = [
    { name: 'Create/List/Update/Archive/View/Clone/Delete' },
];
