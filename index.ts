#! /usr/bin/env node

/**
 * MIT License
 *
 * Copyright (c) 2017 Jakob Lorz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import * as cluster from "cluster";
import * as os from "os";
import * as path from "path";

type SupportedArgCommands = "-c" | "-f";

interface IPreMapArg {
    type: "path" | "arg-command" | "arg-value";
    payload: any;
}

interface IArgCommand {
    type: SupportedArgCommands;
    payload: string | number;
}

const args: IPreMapArg[] = process.argv
    .filter((arg, i) => i > 1)
    .map<IPreMapArg>((arg) => arg.charAt(0) === "." || arg.charAt(0) === "/" ?
        ({ type: "path", payload: arg }) : (arg.charAt(0) === "-" ?
            ({ type: "arg-command", payload: arg }) : ({ type: "arg-value", payload: arg })));

const buildArgumentList = (lst: IArgCommand[], curr: IPreMapArg) => {
    if (curr.type === "arg-value" && lst[lst.length - 1] !== undefined) {
        lst[lst.length - 1].payload = curr.payload;
    }

    if (curr.type === "arg-command" && ["-c", "-f"].indexOf(curr.payload) !== -1) {
        lst.push({ type: curr.payload as SupportedArgCommands, payload: "" });
    }

    return lst;
};

const commands: IArgCommand[] = args
    .filter((arg) => arg.type !== "path")
    .reduce(buildArgumentList, [] as IArgCommand[]);

const force = commands.filter((arg) => arg.type === "-f").length > 0;
const count = ((useCustomCount: boolean) => useCustomCount ?
    commands.filter((arg) => arg.type === "-c" && typeof arg.payload === "number")[0].payload : os.cpus().length)(
        commands.filter((arg) => arg.type === "-c" && typeof arg.payload === "number").length > 0);
const file = ((pathFoundInArgs: boolean) => pathFoundInArgs ?
    args.filter((arg) => arg.type === "path" && typeof arg.payload === "string")[0].payload as string : undefined)(
        args.filter((arg) => arg.type === "path" && typeof arg.payload === "string").length > 0);

if (!file) {
    throw new Error("path to main *.js file is missing");
}

if (cluster.isMaster) {
    cluster.setupMaster({
        args: process.argv,
        exec: path.join(process.cwd(), file),
    });

    for (let i = 0; i < count; i++) {
        cluster.fork();
    }

    cluster.on("exit", () => force ? cluster.fork() : ({}));
}
