"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
// @ts-ignore
const node_persist_1 = require("node-persist");
const inquirer = require("inquirer");
const chalk_1 = require("chalk");
var command_1 = require("@oclif/command");
exports.run = command_1.run;
const cli_ux_1 = require("cli-ux");
exports.protocol = 'https://';
exports.version = 'v1';
exports.user = {
    data: {
        token: '',
        id: '',
        namespaceId: '',
        orgId: ''
    },
    full: {}
};
node_persist_1.init();
async function hamdleMissingOption(option, type, defaultValue, choices) {
    // console.log(`option missing ${option} , type of input: ${type}`);
    if (type === 'single') {
        const question = {
            type: `${option}`,
            name: `${option}`,
            message: `Please provide ## ${option} ## `,
            default: defaultValue,
        };
        const answer = await inquirer.prompt([question]);
        return answer[option].toString();
        // return answer;
    }
    else if (type === 'multi' && choices !== null) {
        const list = {
            type: `list`,
            name: `${option}`,
            message: 'Select an element from the choices',
            choices: choices,
            default: choices[0],
        };
        // @ts-ignore
        const selected = await inquirer.prompt(list);
        return selected[option].toString();
    }
    return '';
}
exports.hamdleMissingOption = hamdleMissingOption;
async function copyFile(file) {
    const data = await fs_1.promises.readFile(file);
    if (!data) {
        console.log(chalk_1.default.red.bold('file not found. Terminating process'));
        process.exit(0);
    }
    return Buffer.from(data);
}
exports.copyFile = copyFile;
// UI text limit
function minimizeText(text) {
    const limit = 18;
    if (text.length > limit) {
        return text.substring(0, limit) + '..';
    }
    return text;
}
exports.minimizeText = minimizeText;
function showTable(list, targetFields) {
    list.forEach((entity) => {
        for (const field in entity) {
            if (typeof entity[field] === 'string' && field !== 'id' && field !== 'status' && field !== 'credentialsSecretId') {
                entity[field] = minimizeText(entity[field]);
            }
        }
    });
    const tableDatas = {};
    targetFields.forEach((elmt) => {
        tableDatas[elmt['name']] = {};
        if (elmt['header'] !== null) {
            tableDatas[elmt['name']]['header'] = elmt['header'];
        }
        if (elmt.nestedField !== null) {
            tableDatas[elmt['name']]['get'] = (row) => row[elmt.nestedField] ? row[elmt.nestedField][elmt['name']] : 'none';
        }
        if (elmt.subField) {
            tableDatas[elmt['name']]['get'] = (row) => row[elmt['name']][elmt.subField];
        }
    });
    cli_ux_1.default.table(list, tableDatas, {});
}
exports.showTable = showTable;
function showSingleTable(entity) {
    const list = [];
    for (let field in entity) {
        list.push({ KEY: field, VALUE: entity[field] });
    }
    // @ts-ignore
    cli_ux_1.default.table(list, { KEY: { header: 'KEY' }, VALUE: { header: 'VALUE' } }, {});
}
exports.showSingleTable = showSingleTable;
