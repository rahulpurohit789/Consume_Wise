// MongoDB initialization script
db = db.getSiblingDB('consumewise');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        }
      }
    }
  }
});

db.createCollection('scanrecords', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'productName', 'nutritionFacts', 'healthScore', 'aiAnalysis'],
      properties: {
        userId: {
          bsonType: 'objectId'
        },
        productName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200
        },
        healthScore: {
          bsonType: 'number',
          minimum: 1,
          maximum: 10
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.scanrecords.createIndex({ userId: 1, scannedAt: -1 });
db.scanrecords.createIndex({ productName: 'text' });

print('Database initialized successfully');

