// Minimal tools configuration for docs-as-code workflows
// Reduced from 89 tools to 6 tools for minimal context overhead
// Target: ~500-800 tokens vs ~10,000 tokens in full config

const minimalToolsConfig = {
  // 1. Create or update file (combined from create_file + update_file)
  create_or_update_file: {
    name: "create_or_update_file",
    description: "Create or update file in repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
        content: { type: "string" },
        message: { type: "string" },
        ignore_docroot: {
          type: "boolean",
          description: "Set to true to bypass docroot restrictions and access the entire repository"
        },
        allow_dotfiles: {
          type: "boolean",
          description: "Allow access to hidden system files (starting with '.')"
        }
      },
      required: ["path", "content", "message"]
    }
  },

  // 2. Get file contents
  get_file: {
    name: "get_file",
    description: "Get file contents",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
        ignore_docroot: {
          type: "boolean",
          description: "Set to true to bypass docroot restrictions and access the entire repository"
        },
        allow_dotfiles: {
          type: "boolean",
          description: "Allow access to hidden system files (starting with '.')"
        }
      },
      required: ["path"]
    }
  },

  // 3. List directory contents
  list_contents: {
    name: "list_contents",
    description: "List directory contents",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
        ignore_docroot: {
          type: "boolean",
          description: "Set to true to bypass docroot restrictions and access the entire repository"
        },
        allow_dotfiles: {
          type: "boolean",
          description: "Allow access to hidden system files (starting with '.')"
        }
      }
    }
  },

  // 4. Delete file
  delete_file: {
    name: "delete_file",
    description: "Delete file from repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
        message: { type: "string" },
        ignore_docroot: {
          type: "boolean",
          description: "Set to true to bypass docroot restrictions and access the entire repository"
        },
        allow_dotfiles: {
          type: "boolean",
          description: "Allow access to hidden system files (starting with '.')"
        }
      },
      required: ["path", "message"]
    }
  },

  // 5. Search code/documentation
  search_code: {
    name: "search_code",
    description: "Search repository code",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        repo: { type: "string" },
        ignore_docroot: {
          type: "boolean",
          description: "Set to true to bypass docroot restrictions and search the entire repository"
        },
        allow_dotfiles: {
          type: "boolean",
          description: "Allow access to hidden system files (starting with '.')"
        }
      },
      required: ["query"]
    }
  },

  // 6. List commits (for file history)
  list_commits: {
    name: "list_commits",
    description: "List commit history",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
        ignore_docroot: {
          type: "boolean",
          description: "Set to true to bypass docroot restrictions and access the entire repository"
        },
        allow_dotfiles: {
          type: "boolean",
          description: "Allow access to hidden system files (starting with '.')"
        }
      }
    }
  },

  // 7. Get repository catalog
  get_repository_catalog: {
    name: "get_repository_catalog",
    description: "Get lightweight catalog of all documents in repository with metadata - single call returns entire document structure",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (optional, uses default)"
        },
        repo: {
          type: "string",
          description: "Repository name (optional, uses default)"
        },
        path: {
          type: "string",
          description: "Root path to catalog (optional, default: root)"
        },
        include_extensions: {
          type: "array",
          items: { type: "string" },
          description: "File extensions to include (optional, default: ['.md', '.txt'])"
        },
        ignore_docroot: {
          type: "boolean",
          description: "Set to true to bypass docroot restrictions and catalog the entire repository"
        },
        allow_dotfiles: {
          type: "boolean",
          description: "Allow access to hidden system files (starting with '.')"
        }
      }
    }
  }
};

module.exports = minimalToolsConfig;

// Stats:
// - Tools: 7 (down from 89) = 92% reduction
// - Lines: ~130 (down from 2,851) = 95% reduction
// - Estimated tokens: ~750 (down from ~10,000) = 92% reduction
