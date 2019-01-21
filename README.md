stylus-inheritance-loader
=========================

Preloader for *.styl files to reduce LOC number needed for inheritance.

## Examples
### Block

**/b-button.styl**

```styl
@import "../i-block/i-block.styl"

$p = {
 size: (xxs 0.6) (xs 0.8) (s 0.9) (m 1) (l 1.2) (xl 1.4) (xxl 1.8)
 background: transparent
 color: #000
}

b-button extends i-base
  &__content
    background $p.background
    color $p.color
```

### Modifier

**/b-button_theme_light.styl**

```styl
$p = {
 color: #CCC
}

b-button_theme_light extends b-button
  /theme &__content
    color $p.color
```
