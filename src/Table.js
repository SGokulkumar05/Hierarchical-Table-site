import React, { useState, useEffect } from "react";
import { initialData } from "./inputData";

// Helper function to calculate variance
const calculateVariance = (newValue, originalValue) => {
  if (originalValue === 0) return 0; // Avoid division by zero
  return ((newValue - originalValue) / originalValue) * 100;
};

// Recursive function to update subtotals (without overriding initial values)
const updateSubtotals = (rows) => {
  return rows.map((row) => {
    if (row.children) {
      const newChildren = updateSubtotals(row.children);
      const newValue = newChildren.reduce((sum, child) => sum + child.value, 0);
      return { ...row, value: newValue, children: newChildren };
    }
    return row;
  });
};

// Recursive function to distribute subtotal changes to leaves
const distributeSubtotal = (row, newValue) => {
  if (row.children) {
    const totalChildValue = row.children.reduce(
      (sum, child) => sum + child.value,
      0
    );
    if (totalChildValue === 0) {
      // If all children have zero value, distribute equally
      const equalValue = newValue / row.children.length;
      const newChildren = row.children.map((child) => ({
        ...child,
        value: parseFloat(equalValue.toFixed(2)),
      }));
      return { ...row, value: newValue, children: newChildren };
    } else {
      // Distribute proportionally based on contribution
      const newChildren = row.children.map((child) => {
        const contribution = (child.value / totalChildValue) * newValue;
        return { ...child, value: parseFloat(contribution.toFixed(2)) }; // Round to 2 decimal places
      });
      return { ...row, value: newValue, children: newChildren };
    }
  }
  return { ...row, value: newValue };
};

// Recursive function to calculate grand total from leaf nodes
const calculateGrandTotal = (rows) => {
  let total = 0;
  const traverse = (rows) => {
    rows.forEach((row) => {
      if (row.children) {
        traverse(row.children); // Traverse children if present
      } else {
        total += row.value; // Add value if it's a leaf node
      }
    });
  };
  traverse(rows);
  return total;
};

// Main App Component
const App = () => {
  const [data, setData] = useState(initialData);
  const [initialValues, setInitialValues] = useState({}); // Store initial values for variance calculation

  // Store initial values for variance calculation
  useEffect(() => {
    const initialValuesMap = {};
    const traverse = (rows) => {
      rows.forEach((row) => {
        initialValuesMap[row.id] = row.value; // Store the initial value
        if (row.children) traverse(row.children);
      });
    };
    traverse(initialData.rows); // Use initialData.rows to preserve initial values
    setInitialValues(initialValuesMap);
  }, []);

  // Update subtotals whenever data changes
  useEffect(() => {
    const updatedData = updateSubtotals(data.rows);
    setData({ rows: updatedData });
  }, [data.rows]);

  // Handle Allocation % button click
  const handleAllocationPercentage = (id, percentage) => {
    if (isNaN(percentage) || percentage < 0) {
      alert("Please enter a valid non-negative percentage.");
      return;
    }
    if (percentage === 0) {
      alert("A 0% increase will not change the value.");
      return;
    }
    const updatedRows = data.rows.map((row) =>
      updateRow(row, id, (value) => value * (1 + percentage / 100))
    );
    setData({ rows: updatedRows });
  };

  // Handle Allocation Val button click
  const handleAllocationValue = (id, newValue) => {
    if (isNaN(newValue) || newValue < 0) {
      alert("Please enter a valid non-negative value.");
      return;
    }
    if (newValue === 0) {
      const confirmZero = window.confirm(
        "Are you sure you want to set this value to 0?"
      );
      if (!confirmZero) return;
    }
    const updatedRows = data.rows.map((row) =>
      updateRow(row, id, () => newValue)
    );
    setData({ rows: updatedRows });
  };

  // Recursive function to update a specific row
  const updateRow = (row, id, updateFunction) => {
    if (row.id === id) {
      const newValue = updateFunction(row.value);
      return distributeSubtotal(row, newValue);
    }
    if (row.children) {
      const newChildren = row.children.map((child) =>
        updateRow(child, id, updateFunction)
      );
      return { ...row, children: newChildren };
    }
    return row;
  };

  // Render rows recursively
  const renderRows = (rows, level = 0) => {
    return rows.map((row) => (
      <React.Fragment key={row.id}>
        <tr>
          <td style={{ paddingLeft: `${level * 20}px` }}>{row.label}</td>
          <td>{row.value.toFixed(2)}</td>
          <td>
            <input type="number" id={`input-${row.id}`} min="0" step="0.01" />
          </td>
          <td>
            <button
              onClick={() => {
                const inputValue = parseFloat(
                  document.getElementById(`input-${row.id}`).value
                );
                handleAllocationPercentage(row.id, inputValue);
              }}
            >
              Allocation %
            </button>
          </td>
          <td>
            <button
              onClick={() => {
                const inputValue = parseFloat(
                  document.getElementById(`input-${row.id}`).value
                );
                handleAllocationValue(row.id, inputValue);
              }}
            >
              Allocation Val
            </button>
          </td>
          <td>
            {calculateVariance(
              row.value,
              initialValues[row.id] || row.value
            ).toFixed(2)}
            %
          </td>
        </tr>
        {row.children && renderRows(row.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Calculate Grand Total from leaf nodes
  const grandTotal = calculateGrandTotal(data.rows);

  return (
    <div>
      <h1>Hierarchical Table</h1>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Label</th>
            <th>Value</th>
            <th>Input</th>
            <th>Allocation %</th>
            <th>Allocation Val</th>
            <th>Variance %</th>
          </tr>
        </thead>
        <tbody>
          {renderRows(data.rows)}
          <tr>
            <td>
              <strong>Grand Total</strong>
            </td>
            <td>
              <strong>{grandTotal.toFixed(2)}</strong>
            </td>
            <td colSpan="4"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default App;
