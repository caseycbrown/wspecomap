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
  (2, 'squirrel boxes', 'trees that have squirrel nests in them'),
  (3, 'trees of note', 'historic elm, trees with plaques'),
  (4, 'sophora', 'former trees that have been removed')
;