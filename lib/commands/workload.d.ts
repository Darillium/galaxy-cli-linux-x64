import { Command, flags } from '@oclif/command';
export default class Workload extends Command {
    static description: string;
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        id: flags.IOptionFlag<string | undefined>;
        file: flags.IOptionFlag<string | undefined>;
        name: flags.IOptionFlag<string | undefined>;
        description: flags.IOptionFlag<string | undefined>;
        completion: flags.IOptionFlag<string | undefined>;
    };
    static args: {
        name: string;
    }[];
    userObject: any;
    workloads: never[];
    selectedEntity: any;
    updateCache: any;
    run(): Promise<void>;
    localMenu(): Promise<any>;
    actionManager(userChoice: {
        [s: string]: string;
    }): Promise<void>;
    cloneTarget(targetId: string): Promise<void>;
    archiveWorkload(targetId: string): Promise<void>;
    filterFields(obj: {
        [s: string]: string;
    }, filters: string[]): {
        [s: string]: string;
    };
    showSelectedEntityMenu(answer: string): Promise<void>;
    deleteTarget(targetId: string): Promise<void>;
    injectUserFile(action: string): Promise<void>;
    updateTarget(targetId: string): Promise<void>;
    select(): Promise<void>;
    listTarget(targetId: string, log: boolean): Promise<void>;
    listAllTargets(log: boolean): Promise<void>;
    createTarget(): Promise<void>;
}
