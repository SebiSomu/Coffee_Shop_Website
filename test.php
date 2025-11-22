<?php
echo "🎯 STEP 1: PHP is working<br>";

// Test include
include 'config.php';
echo "🎯 STEP 2: config.php included<br>";

// Test if $conn exists
if (isset($conn)) {
    echo "✅ STEP 3: \$conn variable EXISTS<br>";
} else {
    echo "❌ STEP 3: \$conn variable is MISSING<br>";
    exit;
}

// Test if $conn is PDO object
if ($conn instanceof PDO) {
    echo "✅ STEP 4: \$conn is a valid PDO object<br>";
} else {
    echo "❌ STEP 4: \$conn is NOT a PDO object<br>";
    exit;
}

// Test database connection
try {
    $stmt = $conn->query("SELECT 1 as test_value");
    $result = $stmt->fetch();
    echo "✅ STEP 5: Database query SUCCESS - Value: " . $result['test_value'] . "<br>";
} catch (PDOException $e) {
    echo "❌ STEP 5: Database query FAILED: " . $e->getMessage() . "<br>";
    exit;
}

echo "🎉 ALL TESTS PASSED! Database connection is WORKING!";
