#!/usr/bin/env python3
import sys
import json
import subprocess
import os

class MCPClient:
    def __init__(self, server_path):
        self.server_path = server_path
        self.request_id = 0
        self.proc = None
        
    def connect(self):
        self.proc = subprocess.Popen(
            ['node', self.server_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        # Send initialize request
        init_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "delete-wing-drawers", "version": "1.0.0"}
            }
        }
        self.proc.stdin.write(json.dumps(init_req) + '\n')
        self.proc.stdin.flush()
        
        # Wait for response
        response = self.proc.stdout.readline()
        return json.loads(response)
    
    def call_tool(self, name, args):
        self.request_id += 1
        req = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "tools/call",
            "params": {"name": name, "arguments": args}
        }
        self.proc.stdin.write(json.dumps(req) + '\n')
        self.proc.stdin.flush()
        
        # Read response
        response_line = self.proc.stdout.readline()
        response = json.loads(response_line)
        
        if 'error' in response:
            raise Exception(response['error']['message'])
        return response['result']
    
    def close(self):
        if self.proc:
            self.proc.terminate()
            self.proc.wait()

def delete_wing_drawers(wing_name):
    if not wing_name:
        print("Usage: python3 delete-wing-drawers.py <wing_name>")
        sys.exit(1)
    
    # Find mempalace server
    server_path = os.path.expanduser('~/.local/lib/mempalace/dist/index.js')
    
    if not os.path.exists(server_path):
        print(f"Error: MemPalace server not found at {server_path}")
        sys.exit(1)
    
    print(f"Deleting all drawers from wing: {wing_name}")
    print(f"Using server: {server_path}")
    
    client = MCPClient(server_path)
    
    try:
        client.connect()
        
        total_deleted = 0
        limit = 50
        
        while True:
            print("Listing drawers...")
            result = client.call_tool('mempalace_list_drawers', {
                'wing': wing_name,
                'limit': limit
            })
            
            content = json.loads(result['content'][0]['text'])
            
            if not content.get('drawers') or len(content['drawers']) == 0:
                print("No more drawers found.")
                break
            
            print(f"Found {len(content['drawers'])} drawers, deleting...")
            for drawer in content['drawers']:
                print(f"  Deleting: {drawer['drawer_id']}")
                client.call_tool('mempalace_delete_drawer', {
                    'drawer_id': drawer['drawer_id']
                })
                total_deleted += 1
        
        print(f"Finished. Total drawers deleted: {total_deleted}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == '__main__':
    wing_name = sys.argv[1] if len(sys.argv) > 1 else None
    delete_wing_drawers(wing_name)
