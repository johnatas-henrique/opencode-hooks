#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// JSON-RPC client for MCP
class MCPClient {
  constructor(serverPath) {
    this.serverPath = serverPath;
    this.requestId = 0;
    this.server = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.server = spawn('node', [this.serverPath]);

      let buffer = '';
      this.server.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.id === 1 && response.result) {
                resolve();
              }
            } catch (e) {}
          }
        }
      });

      // Send initialize request
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'delete-wing-drawers', version: '1.0.0' },
        },
      };

      this.server.stdin.write(JSON.stringify(initRequest) + '\n');

      setTimeout(() => resolve(), 2000);
    });
  }

  async callTool(name, args) {
    return new Promise((resolve, reject) => {
      this.requestId++;
      const request = {
        jsonrpc: '2.0',
        id: this.requestId,
        method: 'tools/call',
        params: { name, arguments: args },
      };

      let buffer = '';
      const onData = (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.id === this.requestId) {
                this.server.stdout.removeListener('data', onData);
                if (response.error) {
                  reject(new Error(response.error.message));
                } else {
                  resolve(response.result);
                }
              }
            } catch (e) {}
          }
        }
      };

      this.server.stdout.on('data', onData);
      this.server.stdin.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        this.server.stdout.removeListener('data', onData);
        reject(new Error('Timeout'));
      }, 10000);
    });
  }

  close() {
    if (this.server) {
      this.server.kill();
    }
  }
}

async function deleteWingDrawers(wingName) {
  if (!wingName) {
    console.error('Usage: node delete-wing-drawers.js <wing_name>');
    process.exit(1);
  }

  // Find mempalace server
  const serverPath = path.join(
    process.env.HOME,
    '.local/lib/mempalace/dist/index.js'
  );

  console.log(`Deleting all drawers from wing: ${wingName}`);
  console.log(`Using server: ${serverPath}`);

  const client = new MCPClient(serverPath);

  try {
    await client.connect();

    let totalDeleted = 0;
    const limit = 50;

    while (true) {
      console.log('Listing drawers...');
      const listResult = await client.callTool('mempalace_list_drawers', {
        wing: wingName,
        limit: limit,
      });

      const content = listResult.content[0].text;
      const data = JSON.parse(content);

      if (!data.drawers || data.drawers.length === 0) {
        console.log('No more drawers found.');
        break;
      }

      console.log(`Found ${data.drawers.length} drawers, deleting...`);

      for (const drawer of data.drawers) {
        console.log(`  Deleting: ${drawer.drawer_id}`);
        await client.callTool('mempalace_delete_drawer', {
          drawer_id: drawer.drawer_id,
        });
        totalDeleted++;
      }
    }

    console.log(`Finished. Total drawers deleted: ${totalDeleted}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.close();
  }
}

const wingName = process.argv[2];
deleteWingDrawers(wingName);
