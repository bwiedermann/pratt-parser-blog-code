import * as d3Hierarchy from 'd3-hierarchy';
import * as d3Select from 'd3-selection';
import * as d3shape from 'd3-shape';
import * as AST from './ast';

export function visualize(nodes: AST.Node[]): void {

    // Placement and size of tree
    const margin = {top: 20, right: 90, bottom: 20, left: 90};
    const height = 300 - margin.top - margin.bottom;
    const width  = 500 - margin.left - margin.right;
  
    // Make the svg
    d3Select.select('#viz').selectAll('svg').remove();
    const viz = d3Select.select('#viz').append('svg');
  
    // Remove existing visualizations
    viz.selectAll('*').remove();
  
    // Add a new visualization
    viz.attr('width', width + margin.left + margin.right)
       .attr('height', height + margin.top + margin.bottom);

    const root: Node = {nodeType: 'Program', children: nodes}

    // Visualize all the statements
    // for (var statement of nodes) {

      // Create the tree and layout
      const treemap = d3Hierarchy.tree()
        .size([height, width])
        .separation(() => 1);
      const treelayout = d3Hierarchy.hierarchy(root, getChildren);
      const tree = treemap(treelayout);
  
      // Add a new graph element for this statement
      const g = viz.append('g')
                  //  .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`);
                   .attr('transform', `translate(${margin.left}, ${margin.top})`)
                   .attr("font-family", "sans-serif")
                   .attr("font-size", 12)
               
      // Edge updates
      const link = g.selectAll('path.link').data(tree.links());

      // Edge entry
      const linkEnter = link.enter().append('path', 'g');
        
      // general edge attributes
      linkEnter.attr('class', 'link')
               .attr('fill', 'none')
               .attr("stroke-opacity", 0.4)
               .attr('stroke', '#555')
               .attr("stroke-width", 1.5)
               .attr('d', connection);

        
      // Node updates
      const node = g.selectAll('g.node').data(tree.descendants());

      // Node entry
      const nodeEnter = node.enter().append('g');

      // general node attributes
      nodeEnter.attr('class', 'node')
               .attr('transform', d => `translate(${d.y}, ${d.x})`);

      nodeEnter.append('circle')
               .attr("fill", getFill)
               .attr('r', '2.5')
               .attr('stroke-width', 10);

      // add text
      nodeEnter.append('text')
                // .attr('dy', '-10px')
                .attr("dy", "0.31em")
                .attr("x", d => d.children ? -8 : 8)
                .attr("text-anchor", d => d.children ? "end" : "start")
                .attr('fill', d => isUndefined(d) ? '#fc6666' : 'black')
                .style("fill-opacity", 1)
                .call(getTextBox)
                .datum(d => d.data)
                .text(getText)
          .clone(true).lower()
            .attr("stroke", "white");
    
      // Highlight undefined -- not working
      // Inspired in part by https://stackoverflow.com/questions/32026194/how-to-add-a-background-color-to-d3-text-elements
      nodeEnter.filter((d,i) => isUndefined(d))
        .call(yep)
        .insert('rect', 'text')
        .attr("x", function(d){return d.bbox.x})
        .attr("y", function(d){return d.bbox.y})
        .attr("width", function(d){return d.bbox.width})
        .attr("height", function(d){return d.bbox.height}) 
        .attr('fill', 'black')             
    // }
}

// From https://stackoverflow.com/questions/32026194/how-to-add-a-background-color-to-d3-text-elements
function getTextBox(selection : any) {
  selection.each(function(d : any){d.bbox = this.getBBox();})
}

function yep(selection : any) {
  // console.log(selection.nodes().map((d)=>d.bbox));
}


const connection = d3shape.linkHorizontal().x(d => d.y).y(d => d.x)

function getChildren(node: AST.Node): AST.Node[] {
  var children: AST.Node[] = [];
  switch (node!.nodeType) {
    case 'Program':
      node = node as AST.ProgramNode;
      children = node!.children;
      break;
    case 'Function':
      node = node as AST.FunctionNode;
      children = node!.args;
      break;
    case 'Choose':
      node = node as AST.ChooseNode;
      children = [node!.case.predicate, node!.case.consequent, node!.otherwise];
      break;
    case 'BinaryOperation':
      node = node as AST.BinaryOperationNode;
      children = [node!.left, node.right];
      break;
    case 'VariableAssignment':
      node = node as AST.VariableAssignmentNode;
      children = [node!.assignment];
      break;
    default:
      children = [];
    }

  return children;
}

function getText(node: AST.Node) {
  var text = "";
  switch (node!.nodeType) {
    case 'Program':
      text = '';
      break;
    case 'Function':
      node = node as AST.FunctionNode;
      text = node.name;
      break;
    case 'Choose':
      text = "choose";
      break;
    case 'BinaryOperation':
      node = node as AST.BinaryOperationNode;
      text = node.operator;
      break;
    case 'VariableAssignment':
      node = node as AST.VariableAssignmentNode;
      text = node.name;
      break;
    case 'Identifier':
      node = node as AST.IdentifierNode;
      text = node.name;
      break;
    case 'Number':  
      node = node as AST.NumberNode;
      text = node.value.toString();
      break;
    case 'Boolean':
      node = node as AST.BooleanNode;
      text = node.value.toString();
      break;
    default:
      text = "";
  }

  return text;
}

function getFill(node : AST.ProgramNode): string {
  if (isUndefined(node)) {
    return '#fc6666'
  }
  if (node.children) {
    return '#555'
  } else {
    return '#999'
  }
}

function isUndefined(d : any) {
  return d.data.outputType?.status === 'Maybe-Undefined'
}