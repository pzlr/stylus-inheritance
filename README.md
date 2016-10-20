stylus-inheritance-loader
=========================

Preloader for *.interface.styl files to reduce LOC number needed for inheritance.

## Examples
### Block

```styl
@import "../i-base/i-base.interface.styl"

$p = {
 size: (xxs 0.6) (xs 0.8) (s 0.9) (m 1) (l 1.2) (xl 1.4) (xxl 1.8),
 background: transparent,
 color: #000
}

i-block extends i-base
  &__content
    background $p.background
    color $p.color
```

### Modifier

```styl
$p = {
 color: #CCC
}

i-block_theme_light extends i-base
  /theme &__content
    color $p.color
```
