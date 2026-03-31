import { FunctionTool } from '@google/adk';

const dateTool = new FunctionTool({
    name: 'get_current_date_and_time',
    description: 'Returns the current date and time on the client computer.',
    execute: () => {
        return { dateTime: new Date().toISOString() };
    }
});

function convertSchema(googleSchema: any): any {
    if (!googleSchema) return { type: 'object', properties: {} };
    const jsonSchema: any = {};
    if (googleSchema.type) {
        jsonSchema.type = googleSchema.type.toLowerCase();
    }
    if (googleSchema.properties) {
        jsonSchema.properties = {};
        for (const [key, value] of Object.entries(googleSchema.properties)) {
            jsonSchema.properties[key] = convertSchema(value);
        }
    }
    if (googleSchema.items) {
        jsonSchema.items = convertSchema(googleSchema.items);
    }
    if (googleSchema.required) {
        jsonSchema.required = googleSchema.required;
    }
    if (googleSchema.description) {
        jsonSchema.description = googleSchema.description;
    }
    if (googleSchema.enum) {
        jsonSchema.enum = googleSchema.enum;
    }
    return jsonSchema;
}

console.log(JSON.stringify(convertSchema(dateTool._getDeclaration().parameters), null, 2));
