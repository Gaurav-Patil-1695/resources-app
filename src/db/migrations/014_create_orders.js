exports.up = function (knex) {
  return knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_number', 50).notNullable().unique();
    table.integer('user_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.integer('shipping_address_id').unsigned().nullable()
      .references('id').inTable('addresses').onDelete('SET NULL');
    table.integer('billing_address_id').unsigned().nullable()
      .references('id').inTable('addresses').onDelete('SET NULL');
    table.integer('promo_code_id').unsigned().nullable()
      .references('id').inTable('promo_codes').onDelete('SET NULL');
    table.enu('status', [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'return_requested',
      'returned',
      'refunded'
    ]).notNullable().defaultTo('pending');
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0);
    table.decimal('shipping_charge', 10, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('currency', 10).notNullable().defaultTo('INR');
    table.enu('payment_status', ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'])
      .notNullable().defaultTo('pending');
    table.string('payment_method', 50).nullable();
    table.text('notes').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['status']);
    table.index(['payment_status']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('orders');
};
