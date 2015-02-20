/*
  populate layer table
*/


insert into
  layer (
    layer_id,
    name,
    description
  )
values
  (1, 'default', 'all trees that are displayed by default'),
  (2, 'nesting boxes', 'trees that have nests in them'),
  (3, 'trees of note', 'historic elm, trees with plaques')
;