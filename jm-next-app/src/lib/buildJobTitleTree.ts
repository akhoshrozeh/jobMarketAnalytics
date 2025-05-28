export interface JobTitle {
    title: string;
    count: number;
  }
  
  export interface TreeNode {
    name: string;
    value?: number;
    children?: TreeNode[];
  }
  
  /**
   * Parses a job title into hierarchical parts.
   * Returns an array of parts from most general to most specific.
   */

  function parseJobTitleHierarchy(title: string): string[] {
    // some functions that declutter the code a bit
    const lt = title.toLowerCase();
    const _has = (str: string) => {return lt.includes(str)}
    const has = (words: string[]) => {return words.some(word => _has(word))}
    const hierarchy: string[] = [];
    const p = (str: string) => {hierarchy.push(str)}

    const has_any = (words: string[]) => {return words.some(word => _has(word))}
    if (has(["security", "cyber", "threat", "soc", "cybersecurity"])) {
        p("Security")

        if (has(["soc"])) {
            p("SOC")
        }
        else if (has(["devsecops"])) {
          p("DevSecOps")
        }
        else if (has(["analyst"])) {
          p("Analyst")
        }
        else if (has(["engineer"])) {
          p("Engineer")
        }
        else if (has(["architect"])) {
          p("Architect")
        }
        else {
          p(title)
        }
    }

    else if (has(["ui/", "ui ", "/ux ", "ui/ux", "user interface", "user experience"])) {
        p("UI/UX")
        p(title)

        
    }


    // Example hierarchical parsing rules:
    else if (has(["ai","artificial intelligence","ml","machine learning"])) {
        p("AI");
        
        if (has(["ml", "machine learning"])) {
            p("Machine Learning")
        }
        else if (has(["llm", "agent", "fine tune", "fine tune"])) {
            p("LLM/Agents")
        }
        else {
            p("Other")
        }
    }

    else if(has(["full stack", "fullstack", "full-stack", "back end", "backend", "back-end", "front end", "frontend", "front-end", "web developer"])) {
        p("Web Development")

        if (has(["full stack", "fullstack", "full-stack"])) {
            p("Full Stack")
        }
        else if (has(["backend", "back end", "back-end"])) {
            p("Backend")
        }
        else if (has(["frontend", "front end", "front-end"])) {
            p("Frontend")
        }
        else {
            p("Other")
            
        }
    }
    else if (has(["firmware", "embedded", "hardware", "verilog", "systems", "automation"])) {
        p("Systems")

        if (has(["firmware"])) {
            p("Firmware")
        }
        else if (has(["embedded"])) {
            p("Embedded")
        }
        else if (has(["hardware"])) {
            p("Hardware")
        }
        else if (has(["automation"])) {
            p("Automation")
        }
        else {
            p("Other")
        }
    }

    else if (has(["mobile", "ios", "android", "swift", "flutter", "react native", "lynx"])) {
        p("Mobile")
        if (has(["ios", "swift"])) {
            p("iOS")
        }
        else if (has(["android", "kotlin"])) {
            p("Android")
        }
        else if (has(["lynx", "react native", "flutter"])) {
            p("Cross-Platform")
        }
        else {
            p("Other")
        }
    }

    else if (has(["dev ops", "devops", "dev-ops", "dev-op", "infrastructure", "infra", "sysadmin", "sys-admin", "sys-admin", "sysadmin", "sys-admin", "sys-admin", "system admin", "system administrator", "cloud", "network", "networks", "networking", "it"])) {
        p("Infrastructure")

        if (has(["dev ops", "devops", "dev-ops", "dev-op"])) {
            p("DevOps")
        }
        else if (has(["infrastructure", "infra"])) {
            p("Infrastructure")
        }
        else if (has(["sysadmin", "sys-admin", "sys-admin", "sysadmin", "system admin", "system administrator"])) {
            p("SysAdmin")
        }
        else if (has(["cloud"])) {
            p("Cloud")
        }
        else if (has(["network", "networks", "networking"])) {
            p("Networking")
        }
        else if (has(["it"])) {
            p("IT")
        }
        else {
            p("Other")
        }
    }

    

  

    
    

    else if (_has("data")) {
      p("Data");
      
      if (_has("scientist")) {
        p("Data Scientist");
      } else if (_has("engineer")) {
        p("Data Engineer");
      } else if (_has("analyst")) {
        p("Data Analyst");
      } else if (_has("architect")) {
        p("Data Architect")
      }
      else{
        p("Other")
      }
    }

    // 1. First determine the primary category
    else if (has(["software engineer","developer", "software development", "software engineering", "programmer"])) {
        p("Software Engineering");
      
       
        
        // 3. Then determine level/seniority if present
        if (has(["senior", "lead", "principal", "staff", "sr"])) {
          p("Senior");
        } else if (_has("junior")) {
          p("Junior");
        }
        else {
          p(title)
        }
    }
    
    else if (has(["qa", "quality assurance", "quality control", "quality engineer", "quality assurance engineer", "quality control engineer", "quality assurance engineer", "quality control engineer", "quality assurance engineer", "quality control engineer", "test"])) {
        p("QA")
        p(title)

        // if (has(["qa", "quality assurance", "quality control", "quality engineer", "quality assurance engineer", "quality control engineer", "quality assurance engineer", "quality control engineer", "quality assurance engineer", "quality control engineer"])) {
        //     p(title)
        // }
    }
  

    // else {
    //     p(title)
    // }
    // Add more primary categories and their subdivisions...
  
    // Always add the original title as the most specific level
    // Premium feature
    // p(title);
  
    return hierarchy;
  }
  
  /**
   * Recursively ensures a path exists in the tree and updates counts
   */
  function updateTreePath(
    node: TreeNode, 
    path: string[], 
    count: number,
    currentDepth: number = 0
  ): void {
    // Base case: we've processed all parts of the path
    if (currentDepth >= path.length) return;
  
    const currentPart = path[currentDepth];
    
    // Initialize children array if it doesn't exist
    if (!node.children) {
      node.children = [];
    }
  
    // Find or create the child node for this part
    let childNode = node.children.find(child => child.name === currentPart);
    if (!childNode) {
      childNode = { name: currentPart };
      node.children.push(childNode);
    }
  
    // If this is the leaf node (actual job title), update its value
    if (currentDepth === path.length - 1) {
      childNode.value = (childNode.value || 0) + count;
    }
  
    // Recurse to the next level
    updateTreePath(childNode, path, count, currentDepth + 1);
  }
  
  /**
   * Recursively calculates and updates the values for all parent nodes
   */
  function calculateParentValues(node: TreeNode): number {
    if (!node.children) {
      return node.value || 0;
    }
  
    // Calculate the sum of all child nodes
    const childrenSum = node.children.reduce(
      (acc, child) => acc + calculateParentValues(child),
      0
    );
  
    // If the node already has a value, add it to the children sum
    node.value = (node.value || 0) + childrenSum;
    return node.value
  }
  
  /**
   * Builds a hierarchical tree of job titles with unlimited depth
   */
  export function buildJobTitleTree(jobTitles: JobTitle[]): TreeNode {
    const root: TreeNode = { name: "All Jobs" };
  
    // First pass: build the tree structure
    jobTitles.forEach(job => {
      const hierarchy = parseJobTitleHierarchy(job.title);
      updateTreePath(root, hierarchy, job.count);
    });
  
    // Second pass: calculate parent node values
    calculateParentValues(root);
  
    return root;
  }