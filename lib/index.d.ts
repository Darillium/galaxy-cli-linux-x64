/// <reference types="node" />
export { run } from '@oclif/command';
export declare var protocol: string;
export declare var version: string;
export declare let user: {
    data: {
        token: string;
        id: string;
        namespaceId: string;
        orgId: string;
    };
    full: {};
};
export declare function hamdleMissingOption(option: string, type: string, defaultValue: string | undefined, choices: string[] | null): Promise<any>;
export declare function copyFile(file: any): Promise<Buffer>;
export declare function minimizeText(text: string): string;
export declare function showTable(list: Object[], targetFields: Array<{
    name: string;
    header: string | null;
    nestedField: string | null;
    subField: any | null;
}>): void;
export declare function showSingleTable(entity: any): void;
