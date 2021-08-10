const { createServer } = require('@stoplight/prism-http-server');
import { resolve } from "path";
import { IPrismHttpServer } from "@stoplight/prism-http-server/dist/types";
import axios from "axios";
import { IHttpOperation } from "@stoplight/types";
import { createLogger } from "@stoplight/prism-core";

const PORT = 4010;
const logger = createLogger("TEST", { enabled: false });
const { getHttpOperationsFromSpec } = require('@stoplight/prism-cli/dist/operations');

describe("API Contract Test", () => {
  let server: IPrismHttpServer;
  let operations: IHttpOperation[];

  beforeAll(async () => {
    // extract HTTP operations from the OAS file and convert them to an array of spec-agnostic objects
    operations = await getHttpOperationsFromSpec(
      resolve(__dirname, "api.oas2.yaml")
    );
    // create a Prism server programmatically
      server = createServer(operations, {
        components: {
          logger: createLogger('TestLogger'),
        },
        cors: true,
        config: {
          checkSecurity: true,
          validateRequest: true,
          validateResponse: true,
          mock: { dynamic: true },
          errors: false,
        },
      });
    await server.listen(PORT);
  });

  test("test operations", () => {
    // for each operation defined in the OAS file
    return Promise.all(
      operations.map(async (operation) => {
        // dummy convertion from the IHttpOperation to an Axios request
        const request = operation2Request(operation);
        // make a request to the Prism server
        const response = await axios(request);

        // Note: these are vialations provided by Prism
        // In order to assure you meet the contract
        // you should expect vialotions to be undefined.
        expect(response.headers['sl-violations']).toBeUndefined();
      })
    );
  });

  afterEach(async () => {
    await server.close();
  });
});

function operation2Request(operation: IHttpOperation): any {
  // pseudo conversion
  return {
    url: `http://127.0.0.1:${PORT}${operation.path}`,
    method: operation.method,
  };
}
